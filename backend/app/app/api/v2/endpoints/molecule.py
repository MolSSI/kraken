"""
API endpoints for molecules. 
Prefixed with /molecules
"""

import io
from typing import List, Optional, Any

import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from rdkit import Chem
from sqlalchemy import exc, text
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.db.session import models

router = APIRouter()

def _pandas_long_to_wide(df):
    """
    Internal function for reshaping from long to wide format for CSV export.
    """
    # Reshape the data into wide format
    df_wide = df.pivot(index=["molecule_id", "smiles"], columns="property")

    # Flatten multi-level columns and reset the index
    df_wide.columns = ['_'.join(col[::-1]).strip() for col in df_wide.columns.values]

    df_wide.reset_index(inplace=True)

    df_wide.dropna(axis=1, inplace=True)

    return df_wide

def _pandas_to_buffer(df):
    """Internal function for converting dataframe to buffer"""
    
    # Create a buffer to hold the csv file.
    buffer = io.StringIO()

    # Write the dataframe to the buffer.
    df.to_csv(buffer, index=False)

    # Set the buffer to the beginning of the file.
    buffer.seek(0)

    return buffer

def valid_smiles(smiles):
    """Check to see if a smile string is valid to represent a molecule.

    Converts the smile string to an rdkit molecule to see if it is valid, then turns it back into a smile string to return an rdkit standardized
    smiles.

    Parameters
    ----------
    smiles : str
        Smiles string.

    Returns
    -------
    smiles : str
        A smiles string generated from an rdkit  molecule.

    Raises
    ------
    HTTPException
        When an rdkit molecule cannot be created from the smile string.
    HTTPException
        When a smile string cannot be created from an rdkit molecule.
    """
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise HTTPException(status_code=400, detail="Invalid Smiles")

    Chem.SanitizeMol(mol)
    smiles = Chem.MolToSmiles(mol)
    if smiles is None:
        raise HTTPException(status_code=400, detail="Invalid Smiles")

    return smiles

@router.get("/first_id", response_model=Any)
async def get_first_molecule_id(db: Session = Depends(deps.get_db)):
    query = text("SELECT molecule_id FROM molecule ORDER BY molecule_id LIMIT 1;")
    result = db.execute(query).fetchone()
    return {"first_molecule_id": result[0]}

@router.get("/data_types", response_model=Any)
async def get_data_types(db: Session = Depends(deps.get_db)):
    query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    results = db.execute(query).fetchall()
    return {"available_types": [x[0] for x in results if "data" in x[0]] }


@router.get("/{molecule_id}/data_types", response_model=Any)
async def get_molecule_data_types(molecule_id: int | str, db: Session = Depends(deps.get_db)):
    # First, fetch all table names that have 'data' in their name
    query_tables = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%data%';")
    tables = db.execute(query_tables).fetchall()

    # Prepare a dictionary to store the results
    results = {}

    # Loop through each table to check for the molecule_id
    for table in tables:
        table_name = table[0]
        # Assuming the column storing molecule IDs is named 'molecule_id' in all tables.
        # You might need to adjust this according to your database schema.
        query_check = text(f"SELECT EXISTS(SELECT 1 FROM {table_name} WHERE molecule_id = :molecule_id) AS exists;")
        exists = db.execute(query_check, {"molecule_id": molecule_id}).fetchone()[0]
        results[table_name] = exists

    return results

@router.get("/data/{molecule_id}", response_model=Any)
async def get_molecule_data(molecule_id: int | str,
                            data_type: str="ml",
                            db: Session = Depends(deps.get_db)):
    
    # Check for valid data type.
    if data_type.lower() not in ["ml", "dft", "xtb", "xtb_ni"]:
        raise HTTPException(status_code=400, detail="Invalid data type.")
                            
    table_name = f"{data_type}_data"
    query = text(f"""
        SELECT t.*, m.SMILES
        FROM {table_name} t
        JOIN molecule m ON t.molecule_id = m.molecule_id
        WHERE t.molecule_id = :molecule_id
    """)

    stmt = query.bindparams(molecule_id=molecule_id)

    results = db.execute(stmt).fetchall()

    # Hacky way to get each row as a dictionary.
    # do this to generalize for different data sets - column names may vary.
    list_of_dicts = [row._asdict() for row in results]
    
    return list_of_dicts

@router.get("/data/export/batch")
async def get_molecules_data(molecule_ids: str,
                       data_type: str="ml",
                       return_type: str="csv",
                       context: Optional[str]=None,
                       db: Session = Depends(deps.get_db)):
    

    molecule_ids_list = [ x.strip() for x in molecule_ids.split(",")]
    first_molecule_id = molecule_ids_list[0]
    num_molecules = len(molecule_ids_list)

    if context:
        if context.lower() not in ["substructure", "pca_neighbors", "umap_neighbors"]:
            raise HTTPException(status_code=400, detail="Invalid context.")

    # Check for valid data type.
    if data_type.lower() not in ["ml", "dft", "xtb", "xtb_ni"]:
        raise HTTPException(status_code=400, detail="Invalid data type.")
    
    if return_type.lower() not in ["csv", "json"]:
        raise HTTPException(status_code=400, detail="Invalid return type.")
    
    # Use pandas.read_sql_query to get the data.
    table_name = f"{data_type}_data"

    # Generating a safe query with placeholders
    placeholders = ', '.join([':id' + str(i) for i in range(len(molecule_ids_list))])
    query_parameters = {'id' + str(i): mid for i, mid in enumerate(molecule_ids_list)}

    query = text(f"""
        SELECT t.*, m.SMILES
        FROM {table_name} t
        JOIN molecule m ON t.molecule_id = m.molecule_id
        WHERE t.molecule_id IN ({placeholders})
    """)

    df = pd.read_sql_query(query, db.bind, params=query_parameters)

    df_wide = _pandas_long_to_wide(df)      

    if return_type.lower() == "json":
        json_data =  df_wide.to_dict(orient="records")
        return json_data
    else:
        buffer = _pandas_to_buffer(df_wide)

        # Return the buffer as a streaming response.
        filename = f"{data_type}_{first_molecule_id}_{num_molecules}"
        if context:
            filename += f"_{context}"
        filename += ".csv"
        response = StreamingResponse(buffer, media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"

        return response

@router.get("/data/export/{molecule_id}")
async def export_molecule_data(molecule_id: int | str,
                      data_type: str="ml",
                      db: Session = Depends(deps.get_db)):

    
    # Check for valid data type.
    if data_type.lower() not in ["ml", "dft", "xtb", "xtb_ni"]:
        raise HTTPException(status_code=400, detail="Invalid data type.")
    
    # Use pandas.read_sql_query to get the data.
    table_name = f"{data_type}_data"
    query = text(f"""
        SELECT t.*, m.SMILES
        FROM {table_name} t
        JOIN molecule m ON t.molecule_id = m.molecule_id
        WHERE t.molecule_id = :molecule_id
    """)

    stmt = query.bindparams(molecule_id=molecule_id)

    df = pd.read_sql_query(stmt, db.bind)

    # Need to do a check here to see the dataframe is empty, if it is we return 204 (executed properly but has no content)
    if df.empty:
        return Response(status_code=204)
    else:
        df_wide = _pandas_long_to_wide(df)      

        buffer = _pandas_to_buffer(df_wide)

        # Return the buffer as a streaming response.
        response = StreamingResponse(buffer, media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={molecule_id}_{data_type}.csv"
        return response
                 

@router.get("/umap", response_model=List[schemas.MoleculeSimple])
def get_molecule_umap(
    limit: int = 1000,
    category: Optional[str] = None,
    show_ml: bool = False,
    db: Session = Depends(deps.get_db),
):

    query_parameters: dict[str, Any] = {"limit": limit}

    query = """
        SELECT molecule_id, smiles, umap->1 as umap1, umap->2 as umap2, pat FROM molecule
        """

    # Need to build the query based on the inputs
    # the cleanest way to do this is to consider the
    # possible cases separately.

    # Case 1: no category and no ml (default)
    if not category and not show_ml:
        query += """WHERE dft_data IS NOT NULL OR xtb_data IS NOT NULL
        """

    # Case 2: category and no ml
    if category and not show_ml:
        query += """WHERE pat = :category AND (dft_data IS NOT NULL OR xtb_data IS NOT NULL)
        """
        query_parameters["category"] = category

    # Case 3: category and ml
    if category and show_ml:
        query += """WHERE pat = :category
        """
        query_parameters["category"] = category

    # Case 4: no category and ml
    # no additional arugments needed

    query += """ORDER BY molecule_id 
        FETCH FIRST :limit ROWS ONLY;"""

    sql = text(query)
    stmt = sql.bindparams(**query_parameters)

    results = db.execute(stmt).fetchall()

    return results


@router.get("/{molecule_id}", response_model=schemas.Molecule)
def get_a_single_molecule(molecule_id: int | str, db: Session = Depends(deps.get_db)):


    molecule = (
        db.query(models.molecule)
        .filter(models.molecule.molecule_id == molecule_id)
        .one()
    )

    if not molecule:
        raise HTTPException(status_code=404, detail="Molecule not found")

    # Attempt to fetch conformers associated with this molecule from the conformer view
    try:
        conformers = molecule.conformer_collection
    except:
        sql = text("SELECT * FROM conformer WHERE molecule_id = :molecule_id")
        stmt = sql.bindparams(molecule_id=molecule_id)
        conformers = db.execute(stmt).fetchall()

    # for databases where there are no compound names, set the compound name to None
    try: 
        molecule.compound_name
    except AttributeError:
        molecule.compound_name = None

    response = schemas.Molecule(
        molecule_id=molecule.molecule_id,
        smiles=molecule.smiles,
        molecular_weight=molecule.molecular_weight,
        compound_name=molecule.compound_name,
        conformers_id=[c.conformer_id for c in conformers],
    )
    return response


@router.get("/search/", response_model=List[schemas.MoleculeSimple])
def search_molecules(
    substructure: str = "",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
):
    # Check if the substructure provided is valid
    substructure = valid_smiles(substructure)

    # Very slow query observed for substructure search.
    # set enable_sort=off as advised by this blog to improve speed.
    # https://depth-first.com/articles/2021/08/11/the-rdkit-postgres-ordered-substructure-search-problem/
    # ::qmol in the following query allows for SMARTS strings.

    sql = text(
        """
        SET LOCAL enable_sort=off;
        select molecule_id, smiles, molecular_weight, umap->1 as umap1, umap->2 as umap2 from molecule 
        where mol@>:substructure ::qmol
        order by morganbv <%> morganbv_fp(mol_from_smiles(:substructure)) 
        offset :offset 
        limit :limit
        """
    )

    try:
        results = db.execute(
            sql, dict(substructure=substructure, offset=skip, limit=limit)
        ).fetchall()
    except exc.DataError:
        raise HTTPException(status_code=400, detail="Invalid Smiles Substructure!")

    return results


@router.get("/{molecule_id}/neighbors/", response_model=List[schemas.MoleculeNeighbors])
def search_neighbors(
    molecule_id: int | str,
    type: str = "pca",
    components: Optional[str] = None,
    skip: int = 1,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
):

    type = type.lower()
    
    # Check for valid neighbor type.
    if type not in ["pca", "umap"]:
        raise HTTPException(status_code=400, detail="Invalid neighbor type.")

    # Set defaults for components
    if type == "pca" and components is None:
        components = "1,2,3"

    # Set defaults for components
    if type == "umap" and components is None:
        components = "1,2"

    # Check correct format
    components_list = []
    for i in components.split(","):
        try:
            components_list.append(int(i))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Components must be a string of integers separated by commas",
            )

    # Generalized - get max number of components for type by getting one record
    query = text(
        f"SELECT cube_dim({type}) FROM molecule WHERE {type} IS NOT NULL LIMIT 1"
    )

    max_dims = db.execute(query).fetchall()[0][0]

    # Check to see if the pca components requested are valid
    components_list.sort()
    if components_list[-1] > max_dims or len(components_list) > max_dims:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid components, there are only {max_dims} available",
        )

    query = """"""

    # Creates list of strings of indexing the cube using the `->` operator, ex. ["p2->1", "p2->2", ...]
    cube_indexing = ["p2->" + str(i) for i in range(1, len(components_list) + 1)]
    # Creates the string array from the indexing strings. ex. "ARRAY[p2->1, p2->2]"
    array_substitute_one = f'ARRAY[{", ".join(i for i in cube_indexing)}]'
    # Creates the string array for indexing the cube using cube_subset. ex "ARRAY[1, 2, 3, 4]"
    array_substitute_two = f'ARRAY[{", ".join(str(i) for i in components_list)}]'

    query = f"""
    SELECT 
        smiles, 
        molecule_id, 
        pat, 
        {array_substitute_one} as components, 
        '{type}' as type, 
        cube_subset(p1.{type}, {array_substitute_two}) <-> p2 as dist
    FROM 
        molecule, 
        (SELECT {type} FROM molecule WHERE molecule_id=:molecule_id) as p1, 
        cube_subset(molecule.{type}, {array_substitute_two}) as p2
    ORDER BY 
        dist, molecule_id
    OFFSET 
        :offset 
    LIMIT 
        :limit
    """

    sql = text(query)

    try:
        results = db.execute(
            sql, dict(molecule_id=molecule_id, offset=skip, limit=limit)
        ).fetchall()
    except exc.DataError:
        raise HTTPException(
            status_code=400, detail="No molecule with the id provided was found!"
        )

    return results


@router.get("/dimensions/", response_model=List[schemas.MoleculeComponents])
def get_molecule_dimensions(
    type: str = "pca",
    components: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
):
    type = type.lower()

    query = """"""
    where_clause = f"WHERE {type} IS NOT NULL"

    # Check for valid neighbor type.
    if type not in ["pca", "umap"]:
        raise HTTPException(status_code=400, detail="Invalid neighbor type.")

    # Check for valid category type if it was not None.
    if category:
        category = category.lower()

        # Generalized - get different categories for category
        query = text(f"SELECT ARRAY(SELECT DISTINCT LOWER(pat) from molecule)")
        array_of_categories = db.execute(query).fetchall()[0][0]

        if category not in array_of_categories:
            raise HTTPException(status_code=400, detail="Invalid category type.")
        else:
            # Create where clause
            where_clause += " AND pat = :category"

    # Set defaults for components
    if type == "pca" and components is None:
        components = "1,2,3"

    # Set defaults for components
    if type == "umap" and components is None:
        components = "1,2"

    # Check correct format
    components_list = []
    for i in components.split(","):
        try:
            components_list.append(int(i))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Components must be a string of integers separated by commas.",
            )

    # Generalized - get max number of components for type by getting one record
    query = text(
        f"SELECT cube_dim({type}) FROM molecule WHERE {type} IS NOT NULL LIMIT 1"
    )

    max_dims = db.execute(query).fetchall()[0][0]

    # Check to see if the pca components requested are valid
    components_list.sort()
    if components_list[-1] > max_dims or len(components_list) > max_dims:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid components, there are only {max_dims} available",
        )

    # Creates list of strings of indexing the cube using the `->` operator, ex. ["pca->1", "pca->2", ...]
    cube_indexing = [f"{type}->" + str(i) for i in range(1, len(components_list) + 1)]
    # Creates the string array from the indexing strings. ex. "ARRAY[pca->1, pca->2]"
    array_substitute_one = f'ARRAY[{", ".join(i for i in cube_indexing)}]'

    query = f"""
    SELECT 
        smiles, 
        molecule_id,
        pat, 
        {array_substitute_one} as components, 
        '{type}' as type
    FROM 
        molecule
    {where_clause}
    ORDER BY molecule_id
    OFFSET 
        :offset 
    FETCH FIRST :limit ROWS ONLY
    """
    sql = text(query)

    try:
        results = db.execute(
            sql, dict(category=category, offset=skip, limit=limit)
        ).fetchall()
    except exc.DataError:
        raise HTTPException(
            status_code=400,
            detail="No molecules with the parameters provided were found!",
        )

    return results

@router.get("/identifiers/", response_model=List[schemas.MoleculeIdentifiers])
def get_identifiers(smiles: str):
    # Check to see if the smiles is valid
    smiles = valid_smiles(smiles)
    mol = Chem.MolFromSmiles(smiles)
    InChI = Chem.MolToInchi(mol)
    InChIKey = Chem.MolToInchiKey(mol)
    return [{'smiles': smiles, 'InChI': InChI, 'InChIKey': InChIKey}]