/**
 * Modular CEE Question Bank
 * Organized by syllabus and chapter with correct weightage.
 * Provides question templates used to generate 45+ question sets.
 */

// Reusable question templates. Each: { subject, topic, subTopic, text, options[4], correctIdx, rationale, level }
const qBank = {
  biology: [
    // Zoology
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which structure in the nephron reabsorbs glucose?', options: ['Proximal convoluted tubule', 'Loop of Henle', 'Distal tubule', 'Collecting duct'], correct: 0, rationale: 'PCT reabsorbs ~100% of filtered glucose via SGLT.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which blood cells produce antibodies?', options: ['B lymphocytes', 'T lymphocytes', 'Neutrophils', 'Erythrocytes'], correct: 0, rationale: 'B cells differentiate into plasma cells that secrete antibodies.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Where is the sinoatrial node located?', options: ['Right atrium', 'Left atrium', 'Right ventricle', 'Left ventricle'], correct: 0, rationale: 'SA node is in the right atrium.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which hormone regulates blood calcium?', options: ['Parathyroid hormone', 'Insulin', 'Thyroxine', 'Adrenaline'], correct: 0, rationale: 'PTH increases blood calcium.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which brain part controls balance?', options: ['Cerebellum', 'Cerebrum', 'Medulla', 'Hypothalamus'], correct: 0, rationale: 'Cerebellum coordinates balance.', level: 'understanding' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which enzyme in saliva digests starch?', options: ['Salivary amylase', 'Pepsin', 'Lipase', 'Trypsin'], correct: 0, rationale: 'Salivary amylase hydrolyzes starch.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which vessel carries oxygenated blood from lungs?', options: ['Pulmonary vein', 'Pulmonary artery', 'Aorta', 'Vena cava'], correct: 0, rationale: 'Pulmonary vein is the only oxygenated vein.', level: 'understanding' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which organ produces bile?', options: ['Liver', 'Gallbladder', 'Pancreas', 'Stomach'], correct: 0, rationale: 'Liver produces bile.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which gas is exchanged in alveoli?', options: ['Oxygen and CO2', 'Nitrogen and O2', 'CO and O2', 'H2 and N2'], correct: 0, rationale: 'Alveoli exchange O2 and CO2.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which structure filters blood in kidney?', options: ['Glomerulus', 'Ureter', 'Urethra', 'Bladder'], correct: 0, rationale: 'Glomerulus filters blood.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which hormone lowers blood glucose?', options: ['Insulin', 'Glucagon', 'Cortisol', 'Adrenaline'], correct: 0, rationale: 'Insulin lowers blood glucose.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which part of neuron receives signals?', options: ['Dendrites', 'Axon', 'Myelin', 'Axon terminal'], correct: 0, rationale: 'Dendrites receive signals.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which blood type is universal donor?', options: ['O negative', 'AB positive', 'A positive', 'B negative'], correct: 0, rationale: 'O negative lacks A, B, Rh antigens.', level: 'application' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which vitamin is made in skin from sunlight?', options: ['Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin B12'], correct: 0, rationale: 'UV converts 7-dehydrocholesterol to D3.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which connects the cerebral hemispheres?', options: ['Corpus callosum', 'Cerebellum', 'Pons', 'Thalamus'], correct: 0, rationale: 'Corpus callosum connects hemispheres.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which muscle is key for breathing?', options: ['Diaphragm', 'Biceps', 'Quadriceps', 'Deltoid'], correct: 0, rationale: 'Diaphragm drives inspiration.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which is the master gland?', options: ['Pituitary', 'Thyroid', 'Adrenal', 'Pineal'], correct: 0, rationale: 'Pituitary controls other glands.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which pigment colors red blood cells?', options: ['Hemoglobin', 'Melanin', 'Chlorophyll', 'Carotene'], correct: 0, rationale: 'Hemoglobin gives RBC red color.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which digestive part absorbs most nutrients?', options: ['Small intestine', 'Stomach', 'Large intestine', 'Esophagus'], correct: 0, rationale: 'Small intestine with villi absorbs nutrients.', level: 'recall' },
    { topic: 'Human Biology', subTopic: 'Zoology', text: 'Which hormone stimulates milk production?', options: ['Prolactin', 'Oxytocin', 'Estrogen', 'Progesterone'], correct: 0, rationale: 'Prolactin stimulates milk synthesis.', level: 'recall' },
    { topic: 'Evolution', subTopic: 'Zoology', text: 'Who proposed natural selection?', options: ['Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Lamarck'], correct: 0, rationale: 'Darwin proposed natural selection in 1859.', level: 'recall' },
    { topic: 'Evolution', subTopic: 'Zoology', text: 'Which era had dinosaurs?', options: ['Mesozoic', 'Paleozoic', 'Cenozoic', 'Precambrian'], correct: 0, rationale: 'Dinosaurs thrived in the Mesozoic era.', level: 'recall' },
    { topic: 'Classification', subTopic: 'Zoology', text: 'Which kingdom includes prokaryotes?', options: ['Monera', 'Protista', 'Fungi', 'Plantae'], correct: 0, rationale: 'Monera includes bacteria (prokaryotes).', level: 'recall' },
    { topic: 'Classification', subTopic: 'Zoology', text: 'Which class has three-chambered heart?', options: ['Amphibia', 'Mammalia', 'Aves', 'Reptilia'], correct: 0, rationale: 'Amphibians have a 3-chambered heart.', level: 'understanding' },
    { topic: 'Animal Tissues', subTopic: 'Zoology', text: 'Which tissue lines body surfaces?', options: ['Epithelial', 'Connective', 'Muscle', 'Nervous'], correct: 0, rationale: 'Epithelial tissue lines surfaces.', level: 'recall' },
    { topic: 'Animal Tissues', subTopic: 'Zoology', text: 'Which tissue transmits impulses?', options: ['Nervous', 'Epithelial', 'Connective', 'Muscle'], correct: 0, rationale: 'Nervous tissue transmits impulses.', level: 'recall' },
    { topic: 'Environmental', subTopic: 'Zoology', text: 'Which gas causes greenhouse effect?', options: ['CO2', 'O2', 'N2', 'H2'], correct: 0, rationale: 'CO2 is a major greenhouse gas.', level: 'recall' },
    { topic: 'Plasmodium', subTopic: 'Zoology', text: 'Which disease does Plasmodium cause?', options: ['Malaria', 'Cholera', 'Typhoid', 'Dengue'], correct: 0, rationale: 'Plasmodium causes malaria.', level: 'recall' },
    { topic: 'Earthworm', subTopic: 'Zoology', text: 'Which system is absent in earthworm?', options: ['Respiratory system', 'Digestive system', 'Circulatory system', 'Nervous system'], correct: 0, rationale: 'Earthworms lack a specialized respiratory organ.', level: 'understanding' },
    { topic: 'Frog', subTopic: 'Zoology', text: 'Which is an amphibian?', options: ['Frog', 'Lizard', 'Snake', 'Turtle'], correct: 0, rationale: 'Frogs are amphibians living both on land and water.', level: 'recall' },
    // Botany
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which pigment drives photosynthesis?', options: ['Chlorophyll', 'Carotene', 'Xanthophyll', 'Anthocyanin'], correct: 0, rationale: 'Chlorophyll absorbs light for photosynthesis.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which process converts light to chemical energy?', options: ['Photosynthesis', 'Respiration', 'Transpiration', 'Fermentation'], correct: 0, rationale: 'Photosynthesis stores light as chemical energy.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which hormone promotes cell elongation?', options: ['Auxin', 'Ethylene', 'Abscisic acid', 'Cytokinin'], correct: 0, rationale: 'Auxin promotes cell elongation.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which tissue transports water?', options: ['Xylem', 'Phloem', 'Epidermis', 'Cortex'], correct: 0, rationale: 'Xylem transports water upward.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which tissue transports food?', options: ['Phloem', 'Xylem', 'Parenchyma', 'Sclerenchyma'], correct: 0, rationale: 'Phloem transports sugars.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which is water loss from leaves?', options: ['Transpiration', 'Respiration', 'Photosynthesis', 'Guttation'], correct: 0, rationale: 'Transpiration is water loss via stomata.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which hormone ripens fruit?', options: ['Ethylene', 'Auxin', 'Gibberellin', 'Cytokinin'], correct: 0, rationale: 'Ethylene promotes fruit ripening.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which structure controls gas exchange in leaves?', options: ['Stomata', 'Cuticle', 'Epidermis', 'Veins'], correct: 0, rationale: 'Stomata regulate gas exchange.', level: 'recall' },
    { topic: 'Plant Physiology', subTopic: 'Botany', text: 'Which hormone promotes seed germination?', options: ['Gibberellin', 'Abscisic acid', 'Ethylene', 'Auxin'], correct: 0, rationale: 'Gibberellins promote germination.', level: 'recall' },
    { topic: 'Biodiversity', subTopic: 'Botany', text: 'Which plant group includes mosses?', options: ['Bryophyta', 'Pteridophyta', 'Gymnospermae', 'Angiospermae'], correct: 0, rationale: 'Bryophytes include mosses and liverworts.', level: 'recall' },
    { topic: 'Biodiversity', subTopic: 'Botany', text: 'Which plant group includes ferns?', options: ['Pteridophyta', 'Bryophyta', 'Gymnospermae', 'Angiospermae'], correct: 0, rationale: 'Ferns belong to Pteridophyta.', level: 'recall' },
    { topic: 'Ecology', subTopic: 'Botany', text: 'What is an ecosystem?', options: ['Community + environment', 'Only plants', 'Only animals', 'Only soil'], correct: 0, rationale: 'An ecosystem includes organisms and their environment.', level: 'understanding' },
    { topic: 'Cell Biology', subTopic: 'Botany', text: 'Which organelle is the powerhouse?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'], correct: 0, rationale: 'Mitochondria produce ATP.', level: 'recall' },
    { topic: 'Genetics', subTopic: 'Botany', text: 'Who is the father of genetics?', options: ['Gregor Mendel', 'Charles Darwin', 'Watson', 'Crick'], correct: 0, rationale: 'Mendel established laws of inheritance.', level: 'recall' },
    { topic: 'Applied Botany', subTopic: 'Botany', text: 'Which plant is used for fiber?', options: ['Jute', 'Rice', 'Wheat', 'Maize'], correct: 0, rationale: 'Jute is a fiber crop.', level: 'application' }
  ],
  chemistry: [
    { topic: 'General Chemistry', subTopic: 'Physical', text: 'What is pH of neutral solution at 25°C?', options: ['7', '0', '14', '1'], correct: 0, rationale: 'Pure water has pH 7.', level: 'recall' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'Which law relates volume and pressure of gas?', options: ['Boyle\'s law', 'Charles\'s law', 'Avogadro\'s law', 'Gay-Lussac\'s'], correct: 0, rationale: 'Boyle\'s law: P inversely proportional to V.', level: 'recall' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'What is unit of molarity?', options: ['mol/L', 'g/L', 'mol/kg', 'g/mol'], correct: 0, rationale: 'Molarity = mol/L.', level: 'recall' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'Which is solid to gas directly?', options: ['Sublimation', 'Evaporation', 'Condensation', 'Melting'], correct: 0, rationale: 'Sublimation goes solid→gas.', level: 'recall' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'Oxidation state of oxygen in H2O2?', options: ['-1', '-2', '0', '+1'], correct: 0, rationale: 'Oxygen is -1 in peroxides.', level: 'understanding' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'Which law relates volume and temperature at constant pressure?', options: ['Charles\'s law', 'Boyle\'s law', 'Dalton\'s', 'Henry\'s'], correct: 0, rationale: 'Charles\'s law: V/T constant.', level: 'recall' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'What is pH of strong acid?', options: ['Below 7', 'Above 7', 'Exactly 7', 'Exactly 14'], correct: 0, rationale: 'Strong acids have low pH.', level: 'recall' },
    { topic: 'Physical Chemistry', subTopic: 'Physical', text: 'Which process absorbs heat?', options: ['Endothermic', 'Exothermic', 'Isothermal', 'Adiabatic'], correct: 0, rationale: 'Endothermic absorbs heat.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which element has atomic number 6?', options: ['Carbon', 'Nitrogen', 'Oxygen', 'Boron'], correct: 0, rationale: 'Carbon has atomic number 6.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which group has noble gases?', options: ['Group 18', 'Group 1', 'Group 2', 'Group 17'], correct: 0, rationale: 'Noble gases are Group 18.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Most abundant element in Earth\'s crust?', options: ['Oxygen', 'Silicon', 'Aluminum', 'Iron'], correct: 0, rationale: 'Oxygen is ~46% of crust.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which is a halogen?', options: ['Chlorine', 'Sodium', 'Calcium', 'Magnesium'], correct: 0, rationale: 'Chlorine is a halogen.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Formula of common salt?', options: ['NaCl', 'KCl', 'CaCl2', 'Na2CO3'], correct: 0, rationale: 'Common salt is NaCl.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which is a transition metal?', options: ['Iron', 'Sodium', 'Calcium', 'Aluminum'], correct: 0, rationale: 'Iron is a transition metal.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Formula of limestone?', options: ['CaCO3', 'CaO', 'Ca(OH)2', 'CaSO4'], correct: 0, rationale: 'Limestone is CaCO3.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which element has symbol K?', options: ['Potassium', 'Krypton', 'Calcium', 'Carbon'], correct: 0, rationale: 'K is potassium.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which gas is used in Haber process?', options: ['N2 and H2', 'O2 and N2', 'CO2 and H2', 'Cl2 and H2'], correct: 0, rationale: 'Haber uses N2 + H2 to make NH3.', level: 'recall' },
    { topic: 'Inorganic Chemistry', subTopic: 'Inorganic', text: 'Which is a metalloid?', options: ['Silicon', 'Carbon', 'Oxygen', 'Sodium'], correct: 0, rationale: 'Silicon is a metalloid.', level: 'understanding' },
    { topic: 'Organic Chemistry', subTopic: 'Organic', text: 'Functional group in alcohols?', options: ['-OH', '-COOH', '-CHO', '-NH2'], correct: 0, rationale: 'Alcohols have -OH.', level: 'recall' },
    { topic: 'Organic Chemistry', subTopic: 'Organic', text: 'General formula of alkanes?', options: ['CnH2n+2', 'CnH2n', 'CnH2n-2', 'CnHn'], correct: 0, rationale: 'Alkanes are CnH2n+2.', level: 'recall' },
    { topic: 'Organic Chemistry', subTopic: 'Organic', text: 'Simplest alkane?', options: ['Methane', 'Ethane', 'Propane', 'Butane'], correct: 0, rationale: 'Methane is simplest.' , level: 'recall' },
    { topic: 'Organic Chemistry', subTopic: 'Organic', text: 'Functional group in carboxylic acids?', options: ['-COOH', '-OH', '-CHO', '-CO-'], correct: 0, rationale: 'Carboxylic acids have -COOH.', level: 'recall' },
    { topic: 'Organic Chemistry', subTopic: 'Organic', text: 'Product of complete combustion of methane?', options: ['CO2 and H2O', 'CO and H2O', 'C and H2O', 'CO2 and H2'], correct: 0, rationale: 'Complete combustion yields CO2 + H2O.', level: 'understanding' },
    { topic: 'Organic Chemistry', subTopic: 'Organic', text: 'Functional group in aldehydes?', options: ['-CHO', '-COOH', '-OH', '-NH2'], correct: 0, rationale: 'Aldehydes have -CHO.', level: 'recall' }
  ],
  physics: [
    { topic: 'Mechanics', subTopic: 'Mechanics', text: 'SI unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 0, rationale: 'Force is in newtons.', level: 'recall' },
    { topic: 'Mechanics', subTopic: 'Mechanics', text: 'Acceleration due to gravity on Earth?', options: ['9.8 m/s²', '6.7 m/s²', '3.7 m/s²', '1.6 m/s²'], correct: 0, rationale: 'g ≈ 9.8 m/s².', level: 'recall' },
    { topic: 'Mechanics', subTopic: 'Mechanics', text: 'Which law: force = mass × acceleration?', options: ['Newton\'s second', 'Newton\'s first', 'Newton\'s third', 'Gravitation'], correct: 0, rationale: 'F = ma is second law.', level: 'recall' },
    { topic: 'Mechanics', subTopic: 'Mechanics', text: 'Unit of work?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correct: 0, rationale: 'Work is in joules.', level: 'recall' },
    { topic: 'Mechanics', subTopic: 'Mechanics', text: 'Which is a vector?', options: ['Velocity', 'Speed', 'Mass', 'Time'], correct: 0, rationale: 'Velocity has direction.', level: 'recall' },
    { topic: 'Heat and Thermodynamics', subTopic: 'Heat', text: 'SI unit of temperature?', options: ['Kelvin', 'Celsius', 'Fahrenheit', 'Joule'], correct: 0, rationale: 'Kelvin is SI unit.', level: 'recall' },
    { topic: 'Heat and Thermodynamics', subTopic: 'Heat', text: 'Which transfers heat through material?', options: ['Conduction', 'Convection', 'Radiation', 'Evaporation'], correct: 0, rationale: 'Conduction is through contact.', level: 'recall' },
    { topic: 'Heat and Thermodynamics', subTopic: 'Heat', text: 'Which law: energy cannot be created or destroyed?', options: ['First law', 'Second law', 'Third law', 'Zeroth law'], correct: 0, rationale: 'First law is conservation of energy.', level: 'recall' },
    { topic: 'Heat and Thermodynamics', subTopic: 'Heat', text: 'Which transfers heat by fluid movement?', options: ['Convection', 'Conduction', 'Radiation', 'Insulation'], correct: 0, rationale: 'Convection moves heat in fluids.', level: 'recall' },
    { topic: 'Waves and Optics', subTopic: 'Optics', text: 'Speed of light in vacuum?', options: ['3 × 10^8 m/s', '3 × 10^6 m/s', '3 × 10^10 m/s', '3 × 10^5 m/s'], correct: 0, rationale: 'c ≈ 3×10^8 m/s.', level: 'recall' },
    { topic: 'Waves and Optics', subTopic: 'Optics', text: 'Which wave needs a medium?', options: ['Sound wave', 'Light wave', 'Radio wave', 'X-ray'], correct: 0, rationale: 'Sound is mechanical.', level: 'recall' },
    { topic: 'Waves and Optics', subTopic: 'Optics', text: 'Unit of frequency?', options: ['Hertz', 'Watt', 'Joule', 'Newton'], correct: 0, rationale: 'Frequency is in hertz.', level: 'recall' },
    { topic: 'Optics', subTopic: 'Optics', text: 'Which lens converges light?', options: ['Convex', 'Concave', 'Plano-concave', 'Diverging'], correct: 0, rationale: 'Convex lens converges.', level: 'recall' },
    { topic: 'Electricity and Magnetism', subTopic: 'Electricity', text: 'SI unit of electric current?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], correct: 0, rationale: 'Current is in amperes.', level: 'recall' },
    { topic: 'Electricity and Magnetism', subTopic: 'Electricity', text: 'Ohm\'s law?', options: ['V = IR', 'V = I/R', 'V = R/I', 'I = VR'], correct: 0, rationale: 'V = IR.', level: 'recall' },
    { topic: 'Electricity and Magnetism', subTopic: 'Electricity', text: 'Unit of resistance?', options: ['Ohm', 'Volt', 'Ampere', 'Watt'], correct: 0, rationale: 'Resistance is in ohms.', level: 'recall' },
    { topic: 'Electrostatics', subTopic: 'Electrostatics', text: 'Unit of electric charge?', options: ['Coulomb', 'Volt', 'Ampere', 'Ohm'], correct: 0, rationale: 'Charge is in coulombs.', level: 'recall' },
    { topic: 'Electrostatics', subTopic: 'Electrostatics', text: 'Which device stores charge?', options: ['Capacitor', 'Resistor', 'Inductor', 'Diode'], correct: 0, rationale: 'Capacitor stores charge.', level: 'recall' },
    { topic: 'Electrostatics', subTopic: 'Electrostatics', text: 'Unit of capacitance?', options: ['Farad', 'Ohm', 'Volt', 'Henry'], correct: 0, rationale: 'Capacitance is in farads.', level: 'recall' },
    { topic: 'Modern Physics', subTopic: 'Modern', text: 'Who proposed relativity?', options: ['Einstein', 'Newton', 'Bohr', 'Planck'], correct: 0, rationale: 'Einstein proposed relativity.', level: 'recall' },
    { topic: 'Modern Physics', subTopic: 'Modern', text: 'Photon energy formula?', options: ['E = hf', 'E = h/f', 'E = f/h', 'E = hc'], correct: 0, rationale: 'E = hf.', level: 'recall' },
    { topic: 'Nuclear Physics', subTopic: 'Modern', text: 'Which particle has no charge?', options: ['Neutron', 'Proton', 'Electron', 'Positron'], correct: 0, rationale: 'Neutron is neutral.', level: 'recall' },
    { topic: 'Semiconductors', subTopic: 'Modern', text: 'Which is a semiconductor?', options: ['Silicon', 'Copper', 'Rubber', 'Glass'], correct: 0, rationale: 'Silicon is a semiconductor.', level: 'recall' },
    { topic: 'Particle Physics', subTopic: 'Modern', text: 'Which particle builds atoms?', options: ['Proton, neutron, electron', 'Only proton', 'Only electron', 'Photon'], correct: 0, rationale: 'Atoms have p, n, e.', level: 'recall' },
    { topic: 'Sound', subTopic: 'Sound', text: 'Speed of sound in air?', options: ['343 m/s', '1500 m/s', '300 m/s', '1000 m/s'], correct: 0, rationale: 'Sound ≈ 343 m/s in air.', level: 'recall' }
  ],
  mentalAgility: [
    { topic: 'Verbal Reasoning', subTopic: 'Verbal', text: 'Antonym of "abundant"?', options: ['Scarce', 'Plentiful', 'Ample', 'Copious'], correct: 0, rationale: 'Scarce is opposite.', level: 'recall' },
    { topic: 'Verbal Reasoning', subTopic: 'Verbal', text: 'Complete: 2, 4, 8, 16, ___', options: ['32', '24', '20', '18'], correct: 0, rationale: 'Doubles each term.', level: 'understanding' },
    { topic: 'Verbal Reasoning', subTopic: 'Verbal', text: 'Synonym of "rapid"?', options: ['Quick', 'Slow', 'Lethargic', 'Gradual'], correct: 0, rationale: 'Rapid = quick.', level: 'recall' },
    { topic: 'Numerical Reasoning', subTopic: 'Numerical', text: '15% of 200?', options: ['30', '25', '35', '20'], correct: 0, rationale: '0.15 × 200 = 30.', level: 'application' },
    { topic: 'Numerical Reasoning', subTopic: 'Numerical', text: 'Next: 3, 6, 9, 12, ___', options: ['15', '14', '13', '18'], correct: 0, rationale: '+3 each.', level: 'recall' },
    { topic: 'Logical Reasoning', subTopic: 'Logical', text: 'If A > B and B > C, then:', options: ['A > C', 'C > A', 'A = C', 'B > A'], correct: 0, rationale: 'Transitivity.', level: 'understanding' },
    { topic: 'Spatial Reasoning', subTopic: 'Spatial', text: 'How many faces on a cube?', options: ['6', '4', '8', '12'], correct: 0, rationale: 'Cube has 6 faces.', level: 'recall' }
  ]
};

// CEE 2025 Biology chapter weightage: Zoology 40 = Evolution(4)+Classification(8)+Plasmodium/Earthworm/Frog(8)+HumanBiology(14)+AnimalTissues(4)+Environmental(2)
const ce2025BioZoology = [
  { weight: 4, topic: 'Evolution' },
  { weight: 8, topic: 'Classification' },
  { weight: 8, topic: 'Plasmodium/Earthworm/Frog' },
  { weight: 14, topic: 'Human Biology' },
  { weight: 4, topic: 'Animal Tissues' },
  { weight: 2, topic: 'Environmental' }
];
const ce2025BioBotany = [
  { weight: 11, topic: 'Biodiversity' },
  { weight: 5, topic: 'Ecology' },
  { weight: 12, topic: 'Cell Biology/Genetics' },
  { weight: 7, topic: 'Anatomy/Physiology' },
  { weight: 5, topic: 'Applied Botany' }
];

module.exports = { qBank, ce2025BioZoology, ce2025BioBotany };