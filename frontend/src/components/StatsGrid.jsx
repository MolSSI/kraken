import { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, Container, CircularProgress } from "@mui/material";


function StatCard({number, caption, size}) {
  /**
   * Creates a card with a number and caption.
   *  
   *  
   * @param {string} number Number to display in the card.
   * @param {string} caption Caption to display in the card.
   * @param {number} size Size of the card.
   *  
   * @return {StatCard} Card with the number and caption.
   **/

  const cardStyle = {
      height: size,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    };


  return (
      <Grid item xs={12} md={6} lg={4}>
              <Card style={ cardStyle }>
                  <CardContent>
                  <Typography variant="h5" textAlign="center">{ number }</Typography>
                  <Typography variant="subtitle1"> { caption }</Typography>
                  </CardContent>
              </Card>
      </Grid>
  )
}

const StatsGrid = () => {
  const [stats, setStats] = useState(null);
    
  useEffect(() => {
      fetch(`/${document.location.pathname.split('/')[1]}/content/stats.json`)
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
            setStats(data);
          })
          .catch(error => {
              console.error('Error fetching stats:', error);
          });
  }, []);

  return (
    <Container maxWidth="xl" sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {stats ? (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {stats.map((stat, index) => (
            <StatCard key={index} number={stat.number} caption={stat.description} size={150} />
          ))}
        </Grid>
      ) : (
        <>
          <CircularProgress/>
        </>
      )}
    </Container>
  );
};


export default StatsGrid;