from typing import Dict, List, Optional, Any

from pydantic import BaseModel


class Molecule(BaseModel):
    molecule_id: int | str
    smiles: str
    molecular_weight: Optional[float] = None
    conformers_id: List[Optional[int | str]]
    compound_name: Optional[str] = None

class MoleculeData(BaseModel):
    property: str
    max: Optional[float] = None
    min: Optional[float] = None
    delta: Optional[float] = None
    boltzmann_average: Optional[float] = None
    std: Optional[float] = None
    vburminconf: Optional[float] = None

class MoleculeSimple(BaseModel):
    molecule_id: int | str
    umap1: Optional[float] = None
    umap2: Optional[float] = None
    pat: Optional[str] = None
    smiles: str

class MoleculeComponents(BaseModel):
    type: Optional[str] = None
    molecule_id: int | str
    pat: Optional[str] = None
    smiles: str
    components: Optional[list[float]] = None

class MoleculeNeighbors(MoleculeComponents):
    dist: Optional[float] = None

class MoleculeIdentifiers(BaseModel):
    smiles: str
    InChI: str
    InChIKey: str
