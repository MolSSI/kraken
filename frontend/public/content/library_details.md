# Library Details

<div class="centered-container">
     <img src="/kraken/content/kraken-workflow.png" alt="Kraken Workflow" class="responsive-image">
</div>

## Conformational Searching

 Initial ligand geometries were generated using SMILES strings and converted to free ligands and [LNi(CO)<sub>3</sub>] complexes using RDKit, OpenBabel or Molconvert. 
These guess geometries were optimized at the GFN2-xTB level of theory (xTB v6.2.2). 
Optimized geometries were subjected to a conformational search using CREST (v2.8) at the GFN2-xTB level with toluene solvation (GBSA model). 
For ligands containing ferrocene, conformational searches were performed at the GFN-FF level to avoid structural changes.

## xTB Descriptors

 Molecular descriptors at the xTB level for the full conformational ensembles from CREST of the free ligands and the [NiCO<sub>3</sub>]-bound complexes were collected using MORFEUS.

## Selection of conformers for DFT computations

 Conformers from both sets (free ligand and Ni complex) were selected based on the following two criteria:

* Conformers that minimize or maximize any of the following xTB-level steric properties in any of the two conformer sets: 
B1, B5, lval, far_vbur, far_vtot, max_delta_qvbur, max_delta_qvtot, near_vbur, near_vtot, ovbur_max, ovbur_min, ovtot_max, 
ovtot_min, pyr_val, qvbur_max, qvbur_min, qvtot_max, qvtot_min, vbur.

* Up to 20 conformers within 3 kcal/mol relative energy in the <i>free ligand conformer set.</i> If more than 20 conformers are in that range, the selection was made by RMSD pruning (using PyDP4). This enables structurally diverse selection of conformers in the relevant energy window.

## DFT computations

Prior to DFT computations, the [Ni(CO)<sub>3</sub>]-fragment was removed from the Ni complex conformer set to obtain free-ligand initial geometries. 
All DFT optimizations (Gaussian 16, rev C.01) were performed at the PBE-D3(BJ)/6-31+G(d,p) level of theory. 
The corresponding geometries were used for a series of single-point energy calculations at the PBE0-D3(BJ)/def2-TZVP and PBE0-D3(BJ)/def2-TZVP/SMD(CHCl<sub>3</sub>) levels of theory. 
Additional single-points were also run for the radical cations and radical anions from the optimized geometry of the neutral free ligand.

From the DFT calculations, steric, electronic, or full molecule/interaction-type descriptors were collected for each conformer. 
The range of properties across the conformers of a single ligand was treated by using up to five condensed measures for each of the properties.

| Condensed Properties    | Description                                                           | For xTB   | For DFT   | For ML   |
| ----------------------- | --------------------------------------------------------------------- | ---------| --------- | ---------|
| boltzmann               | Boltzmann-weighted average of all conformers' properties (T=298.15 K)  | ✔️        | ✔️       | ✔️      |
| max                     | highest value of a property of any conformer                           | ✔️        | ✔️       | ✔️      |
| min                     | lowest value of a property of any conformer                            | ✔️        | ✔️       | ✔️      |
| std                     | standard deviation of the value  across all conformers                 | ✔️        |          |         |
| vburminconf             | property value of the conformer with the smallest buried volume        |           | ✔️        | ✔️     |
| delta                   | 	difference between the maximum and minimum property values         |           | ✔️        | ✔️     |


## ML Descriptor Prediction

The machine learning portion of the workflow aims to expand the total number of monophosphine ligands in the library from ~1500 (which is a fraction of the total possible space) to > 300,000 ligands. 
The computational workflow used to calculate the set of ~1500 is too intensive to calculate all possible monophosphines, so descriptors were predicted using machine learning methods.

New descriptors were predicted using the sum of contributions of each phosphorus substituent using the "Bag of Substituents" approach. 
These contributions are made up of 576 unique substituents from the ~1500 set of ligands.

For more details on the machine learning models used to predict descriptors, see the <a href="https://pubs.acs.org/doi/10.1021/jacs.1c09718" target="_blank">original publication supporting information.</a>

## Video Tutorial

A video tutorial of Kraken which explains relevant background information and the computational workflow, and provides a walkthrough of this website:

<div class="centered-container">
<iframe width="560" height="315" src="https://www.youtube.com/embed/ApWO7OSvUTk?si=9ImzppUSesQPmkme" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

An extended explanation of the computational workflow used to build the monophosphine library,
as well as details on the collected and predicted descriptors can be found in <a href="https://pubs.acs.org/doi/10.1021/jacs.1c09718" target="_blank">the original publication supporting information.</a>

## Citation
Gensch, T.; dos Passos Gomes, G.; Friederich, P.; Peters, E.; Gaudin, T.; Pollice, R.; Jorner, K.; Nigam, A.; Lindner-D'Addario, M.; Sigman, M. S.; Aspuru-Guzik, A. A Comprehensive Discovery Platform for Organophosphorus Ligands for Catalysis. <span style="font-style: italic;">J. Am. Chem. Soc.</span> <span style="font-weight: bold;">2022</span>, <span style="font-style: italic;">144</span>, 3, 1205–1217. DOI: 10.1021/jacs.1c09718
