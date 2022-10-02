import * as React from 'react';
import { styled } from '@mui/material/styles';
import { TextField } from "@mui/material";
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';

import Button from '@mui/material/Button';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function MoleculeSVG(smiles) {
  let encode = encodeURIComponent(smiles)
  return fetch(`depict/cow/svg?smi=${encode}`)
  .then(response => response.text()
  .then(svg => {return(svg)}))

}

class Search extends React.Component {

  // Constructor
  constructor(props) {
    super(props);

    this.state = {
      defaultSearch: encodeURIComponent('P'),
      skip: 0,
      limit: 9,
      results: [],
      svgs: [],
    };
  };

  componentDidMount() {
    this.substructureSearch(this.state.defaultSearch)
  }

  substructureSearch(substructure) {
    let encoded = encodeURIComponent(substructure)
    fetch(`/api/v1/molecule/search/?substructure=${encoded}&skip=${this.state.skip}&limit=${this.state.limit}`)
    .then(response => response.json())
    .then( (items) => {

      this.setState({
        items: items,
        svgs: [],
      })

      items.map( (item) => {
        let encoded = encodeURIComponent(item.smiles)
        fetch(`/depict/cow/svg?smi=${encoded}&sma=${substructure}&zoom=1.25&w=50&h=50`)
        .then( response => response.text() )
        .then( (text) => {
          let joined = this.state.svgs.concat(text)
          this.setState({
            svgs: joined,
          })
        } )
      });
   } 
   )   
  }

  render () {
    return (
    <Container maxWidth="lg">
      <h2>Substructure Search</h2>
      <TextField id="outlined-basic" 
                label="Enter a SMILES String to Search" 
                variant="outlined"
                 defaultValue= {this.state.defaultSearch} 
                 onChange = { (event) => this.substructureSearch(event.target.value) }  />

    <Grid container spacing={2} sx= {{ mt: 3 }}>
      {this.state.svgs.map((result) => (
        <Grid item xs={12} md={4}>
          <Item>
            <img src={`data:image/svg+xml;utf8,${encodeURIComponent(result)}`} />
          </Item>
        </Grid>
      ))}
      
    </Grid>
    <Button variant="contained" style={{backgroundColor: "#ed1c24"}} sx={{ my: 3 }}>Load More</Button>
  </Container>
  
  )
}
}

export default Search;
