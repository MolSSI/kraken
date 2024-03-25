import React, { useEffect, useState } from 'react';
import { DataGrid, GridFooterContainer, GridFooter } from "@mui/x-data-grid";
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Select, MenuItem } from '@mui/material';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';

import ResponsiveButton from './ResponsiveButton'; 


const dataTypeMapping = {
    "ML Data": "ml",
    "DFT Data": "dft",
    "xTB Data": "xtb",
    "xTB_Ni Data": "xtb_ni"
};

const reverseMapping = {
    "ml_data": "ML Data",
    "dft_data": "DFT Data",
    "xtb_data": "xTB Data",
    "xtb_ni_data": "xTB_Ni Data"
};

async function retrieveMoleculeDataTypes(molecule_id) {
    try {
        const response = await fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/${molecule_id}/data_types`);
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.log(error);
    }
}

async function retrieveData(molecule_id, data_type="ml") {
    try {
        const response = await fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/data/${molecule_id}?data_type=${data_type}`);
        
        // If the status code is 200 we have data for the data type and we can return it, if it is 204 there is no data and we just return null
        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else if (response.status === 204) {
            return null;
        }
        // Catches other errors
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function downloadData(molecule_id, data_type) {
    try {
        const response = await fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/data/export/${molecule_id}?data_type=${data_type}`);
        
        if(response.status === 200) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `data_${molecule_id}_${data_type}.csv`; 
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            console.error("Failed to fetch CSV");
        }
    } catch (error) {
        console.log(error);
    }
}


function CustomFooter({ availableDataTypes, selectedDataType, setSelectedDataType, moleculeID, download }) {
    const handleChange = (event) => {
        setSelectedDataType(event.target.value);
    };

    return (
        <GridFooterContainer sx= {{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <Select
                value={selectedDataType}
                onChange={handleChange}
                displayEmpty
                sx={{ marginLeft: '8px', marginRight: '16px', height: '40px', verticalAlign: 'middle' }}
            >   
                
                {
                    Object.entries(availableDataTypes).filter(([key, value]) => value)
                        .map((type) =>(
                            <MenuItem key={reverseMapping[type[0]]} value={reverseMapping[type[0]]}>{reverseMapping[type[0]]}</MenuItem>
                        ))
                }
            </Select>
        <ResponsiveButton expandedButtonContent={"Download CSV"}  
                            collapsedButtonContent={<span><DownloadIcon /> CSV</span>}
                            disabled={!download} 
                            variant="contained" 
                            color="primary"
                             sx={{ marginLeft: 'auto', marginRight: '16px', verticalAlign: 'middle' }} 
                             onClick={() => { downloadData(moleculeID, dataTypeMapping[selectedDataType]) }} />
        <GridFooter sx={{
          border: 'none', // To delete double border.
        }} />
      </GridFooterContainer>
    );
  }
  
  function CustomNoRowsOverlay({ selectedDataType}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6">{selectedDataType} is not available for this molecule.</Typography>
        </div>
    );
}

// Dynamically generate columns based on the keys of the first data item
const generateColumns = (data) => {
    if (!data || data.length === 0) return [];

    return Object.keys(data[0])
        .filter(key => !key.toLowerCase().includes("id") && key.toLowerCase() !== "smiles") // Exclude columns with "id" or named "smiles"
        .map(key => ({
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // Capitalize the first letter and replace underscores with spaces
            flex: true,
            filterable: true,
            headerAlign: 'right',
            align: 'right',
        }));
};


  

export default function MoleculeDataTable({ molecule_id, initial_data_type }) {
    const [moleculeData, setMoleculeData] = useState(null);
    const [data_type, setDataType] = useState(initial_data_type);
    const [selectedDataType, setSelectedDataType] = useState("DFT Data"); // Set the default value to "ML Data"
    const [moleculeID, setMoleculeID] = useState(molecule_id);
    const [download, setDownload] = useState(true); // Allow CSV download
    const [availableDataTypes, setAvailableDataTypes] = useState([]);

    useEffect(() => {
        async function fetchData() {
            let data = await retrieveData(moleculeID, dataTypeMapping[selectedDataType]);

            if (!data || Object.keys(data).length === 0) {
                const fallbackDataType = selectedDataType === "ML Data" ? "DFT Data" : "ML Data";
                data = await retrieveData(moleculeID, dataTypeMapping[fallbackDataType]);
                if (data && Object.keys(data).length !== 0) {
                    setSelectedDataType(fallbackDataType);
                } else {
                    console.log(`No data available for ${selectedDataType} or ${fallbackDataType}`);
                }
            }

            setMoleculeData(data);
            setDownload(data != null && Object.keys(data).length !== 0);
        }

        fetchData();
    }, [moleculeID, selectedDataType]);

    useEffect(() => {
        async function fetchData() {
            const dataTypes = await retrieveMoleculeDataTypes(moleculeID);
            console.log(dataTypes);
            setAvailableDataTypes(dataTypes);
        }

        fetchData();
        
    }
    , [moleculeID]);

    const columns = generateColumns(moleculeData);

    const rows = moleculeData ? moleculeData
        .map((item, index) => ({
            id: index, // Ensure each row has a unique id
            ...item,
        })) : [];

    return (
        <Paper elevation={3} style={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                components={{ Footer: CustomFooter, NoRowsOverlay: CustomNoRowsOverlay }}
                componentsProps={{
                    footer: { availableDataTypes, selectedDataType, setSelectedDataType, moleculeID, download },
                    noRowsOverlay: { selectedDataType },
                }}
                initialState={{
                    pagination: {
                        pageSize: 100, // This sets the initial page size
                    },
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]} 
            />
        </Paper>
    );
}
