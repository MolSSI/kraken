
import { Route, Routes } from 'react-router-dom';
import MoleculeInfo from '../pages/Molecule';
import NeighborSearchHook from '../pages/Neighbors';


export const AppRoutes = ({ pages }) => (
  <Routes>
    <Route path='/' element={pages['Home']}></Route>
    {Object.keys(pages).map((page, index) => (
      <Route key={index} path={`/${page.replace(" ", "_").toLowerCase()}`} element={pages[page]} />
    ))}
    <Route path="/molecule/:molid" element={<MoleculeInfo />} />
    <Route path="/neighbors/:molid?" element={<NeighborSearchHook />} />
    <Route path="*" status={404}/>
  </Routes>
);