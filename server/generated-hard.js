// Additional Hard (application-level) questions authored to expand the Hard pool
// so practice sets can be heavily Hard-skewed while keeping Easy/Medium minimal.
// Correct answer is always option A (index 0) for consistency with the bank.
// Every item is flagged generated:true for SME review.

const g = (topic, subTopic, text, options, rationale) => ({
  topic, subTopic, text, options, correct: 0, rationale, level: 'application', generated: true
});

const zoology = [
  g('Human Biology and Physiology', 'Zoology', 'If a person suffers a complete spinal cord transection at T10, the most expected finding is:', ['Loss of voluntary motor control below the lesion', 'Loss of cranial nerve function', 'Loss of heart innervation', 'Loss of diaphragm control'], 'Cortical motor tracts below T10 are interrupted, sparing brainstem/cervical control.'),
  g('Genetics', 'Zoology', 'A mutation in the CFTR gene most commonly causes:', ['Cystic fibrosis', 'Sickle cell anemia', 'Hemophilia', 'Marfan syndrome'], 'CFTR defects impair chloride transport, causing cystic fibrosis.'),
  g('Human Biology and Physiology', 'Zoology', 'If the sinoatrial node fails, the heart rate is then determined by:', ['The atrioventricular node (~40-60/min)', 'The vagus nerve', 'The atria alone', 'The lungs'], 'The AV node acts as the backup pacemaker.'),
  g('Genetics', 'Zoology', 'Incomplete dominance is best illustrated by:', ['Pink flowers from red and white parents', 'The AB blood group', 'Tay-Sachs disease', 'Huntington disease'], 'The heterozygote shows an intermediate phenotype.'),
  g('Human Biology and Physiology', 'Zoology', 'A patient with ballooning of the aortic valve cusps most likely has:', ['Aortic regurgitation', 'Mitral stenosis', 'Tricuspid atresia', 'Pulmonary stenosis'], 'An incompetent aortic valve allows backflow (regurgitation).'),
  g('Human Biology and Physiology', 'Zoology', 'If the blood-brain barrier is disrupted by inflammation, the most likely result is:', ['Increased drug penetration into the CNS', 'Reduced glucose use', 'No change in permeability', 'Loss of myelin only'], 'Barrier disruption permits substances to enter brain tissue.'),
  g('Genetics', 'Zoology', 'A chromosomal translocation t(9;22) is characteristic of:', ['Chronic myeloid leukemia', 'Acute lymphoblastic leukemia', 'Hodgkin lymphoma', 'Burkitt lymphoma'], 'The Philadelphia chromosome is seen in CML.'),
  g('Human Biology and Physiology', 'Zoology', 'If aldosterone secretion is chronically high, the expected electrolyte pattern is:', ['Increased Na+ reabsorption and K+ loss', 'Increased K+ reabsorption', 'Net loss of Na+', 'No electrolyte change'], 'Aldosterone conserves Na+ and excretes K+.'),
  g('Human Biology and Physiology', 'Zoology', 'A newborn fails to pass meconium within 48 h with bilious vomiting; this most suggests:', ['Intestinal obstruction (e.g., atresia)', 'A normal variant', 'Isolated pyloric stenosis', 'Colic'], 'Failure to pass stool with bilious vomiting indicates obstruction.'),
  g('Human Biology and Physiology', 'Zoology', 'During strenuous exercise, oxygen delivery to muscle improves mainly through:', ['Increased cardiac output and vascular shunting', 'Decreased heart rate', 'Cerebral vasoconstriction', 'Reduced ventilation'], 'Rising output and redistribution raise muscle oxygen.'),
  g('Human Biology and Physiology', 'Zoology', 'If the posterior pituitary is surgically removed, the dominant hormone deficiency is:', ['ADH (vasopressin)', 'ACTH', 'TSH', 'FSH'], 'The posterior pituitary releases ADH and oxytocin.'),
  g('Genetics', 'Zoology', 'A disorder showing anticipation (earlier, more severe in successive generations) is typical of:', ['Trinucleotide repeat expansion', 'A single point mutation', 'A large deletion', 'A balanced translocation'], 'Repeat expansions worsen across generations.'),
  g('Human Biology and Physiology', 'Zoology', 'If carotid sinus baroreceptors sense high pressure, they trigger:', ['Decreased sympathetic tone and lower heart rate', 'Increased sympathetic tone', 'Widespread vasoconstriction', 'Reflex tachycardia'], 'The baroreflex acts to lower pressure.'),
  g('Microbial Diseases and Immunology', 'Zoology', 'A child with recurrent infections and no thymic shadow on X-ray most suggests:', ['DiGeorge syndrome', 'X-linked SCID', 'Bruton agammaglobulinemia', 'Chronic granulomatous disease'], 'Thymic aplasia is characteristic of DiGeorge.'),
  g('Human Biology and Physiology', 'Zoology', 'If the hepatic portal vein is obstructed, gut blood is diverted via:', ['Portosystemic collateral pathways', 'The aorta', 'The pulmonary veins', 'The renal veins'], 'Collaterals form to bypass the block.'),
  g('Human Biology and Physiology', 'Zoology', 'A patient with a homonymous hemianopia but intact pupil reflex likely has a lesion in:', ['The visual cortex or optic radiations', 'The retina', 'The optic nerve', 'The lens'], 'Cortical lesions spare the pupillary reflex.'),
  g('Human Biology and Physiology', 'Zoology', 'If a person hyperventilates, arterial PCO2 falls and pH:', ['Rises (respiratory alkalosis)', 'Falls sharply', 'Remains unchanged', 'Drops to 6.8'], 'CO2 loss raises arterial pH.'),
  g('Human Biology and Physiology', 'Zoology', 'A male with delayed puberty, anosmia and low GnRH most likely has:', ['Kallmann syndrome', 'Klinefelter syndrome', 'Turner syndrome', 'Prader-Willi syndrome'], 'Kallmann pairs hypogonadotropic hypogonadism with anosmia.')
];

const botany = [
  g('Plant Physiology', 'Botany', 'If CAM plants open stomata at night, the primary advantage is:', ['Water conservation in arid conditions', 'Greater photosynthesis', 'Less respiration', 'Faster growth'], 'Night opening reduces transpirational water loss.'),
  g('Plant Physiology', 'Botany', 'A plant bending toward light does so because:', ['Auxin redistributes to the shaded side', 'Gravity pulls the shoot', 'ABA accumulates', 'Cytokinin declines'], 'Auxin asymmetry drives phototropic bending.'),
  g('Plant Anatomy', 'Botany', 'If the Casparian strip is damaged, the root will:', ['Allow unregulated apoplastic flow to the xylem', 'Stop water uptake', 'Lose chlorophyll', 'Grow taller'], 'The strip normally controls selective uptake.'),
  g('Plant Physiology', 'Botany', 'In nitrogen-fixing nodules, nitrogenase is protected from oxygen by:', ['Leghemoglobin', 'Hemoglobin', 'Myoglobin', 'Carotene'], 'Leghemoglobin buffers O2 around nitrogenase.'),
  g('Plant Physiology', 'Botany', 'A plant exposed to red light then far-red light shows:', ['Reversal of the phytochrome response', 'No effect', 'Permanent dormancy', 'Etiolation'], 'Far-red reverts the active phytochrome form.'),
  g('Plant Anatomy', 'Botany', 'If xylem vessels become embolized, the plant most shows:', ['Wilting despite available soil water', 'Oxygen toxicity', 'Salt buildup', 'Leaf drop only'], 'Embolism blocks water transport.'),
  g('Genetics', 'Botany', 'Crossing homozygous tall (TT) with dwarf (tt) pea and selfing the F1 gives:', ['A 3:1 tall:dwarf ratio', 'A 1:1 ratio', 'All dwarf', 'All heterozygous'], 'The F2 monohybrid ratio is 3:1.'),
  g('Plant Physiology', 'Botany', 'If abscisic acid is applied during drought, stomata:', ['Close to conserve water', 'Open widely', 'Elongate', 'Senesce immediately'], 'ABA triggers stomatal closure.'),
  g('Developmental Botany', 'Botany', 'A seed germinating in the dark first relies on:', ['Stored cotyledon/endosperm reserves', 'Photosynthesis', 'Nitrogen fixation', 'Transpiration'], 'Reserves fuel early heterotrophic growth.'),
  g('Plant Physiology', 'Botany', 'Systemic acquired resistance in plants is triggered mainly by:', ['Salicylic acid signaling', 'Auxin', 'Gibberellin', 'Ethylene alone'], 'SAR is mediated by salicylic acid.'),
  g('Plant Physiology', 'Botany', 'In C3 plants at high temperature, photorespiration rises because:', ['Rubisco binds O2 more readily', 'Stomata open wide', 'Light intensity drops', 'CO2 concentration rises'], 'High T and O2 favor Rubisco oxygenase.'),
  g('Plant Anatomy', 'Botany', 'If the shoot apical meristem is removed but the root meristem intact, the plant will:', ['Release apical dominance and grow laterals', 'Die immediately', 'Show no change', 'Stop all root growth'], 'Removing the apex releases lateral buds.'),
  g('Biodiversity', 'Botany', 'A flower with six stamens, three fused carpels and parallel veins is likely a:', ['Monocot', 'Dicot', 'Gymnosperm', 'Fern'], 'Parallel veins and trimerous parts mark monocots.'),
  g('Plant Physiology', 'Botany', 'If phloem sucrose transport is blocked, the plant cannot:', ['Distribute sugars to sink tissues', 'Photosynthesize', 'Open stomata', 'Fix nitrogen'], 'Phloem moves photosynthate to sinks.'),
  g('Ecology and Vegetation', 'Botany', 'A plant under dense shade with elongated stems and small leaves shows:', ['Etiolation', 'Senescence', 'Dormancy', 'Guttation'], 'Shade triggers etiolated growth.'),
  g('Plant Physiology', 'Botany', 'If the thylakoid membrane is disrupted, which process fails first?', ['The light-dependent reactions', 'The stromal Calvin cycle', 'Transpiration', 'Guttation'], 'Thylakoids host the light reactions.'),
  g('Plant Physiology', 'Botany', 'Nitrogen deficiency first appears in:', ['Older leaves (a mobile nutrient)', 'Young leaves only', 'The flowers', 'The roots'], 'Mobile N is remobilized from old leaves.'),
  g('Applied Botany', 'Botany', 'If excess fertilizer makes soil hypertonic, the result is:', ['Plasmolysis and root death', 'Faster growth', 'More flowers', 'No effect'], 'High solute draws water out of roots.')
];

const chemistry = [
  g('Physical Chemistry', 'Physical', 'Titrating 0.1 M HCl with 0.1 M NaOH, the equivalence point pH is:', ['7', 'Less than 7', 'Greater than 7', '0'], 'Strong acid with strong base gives neutral equivalence.'),
  g('Physical Chemistry', 'Physical', 'Adding heat to an endothermic equilibrium shifts it:', ['To the right (products)', 'To the left', 'Not at all', 'To completion only'], 'Heat acts as a reactant for endothermic steps.'),
  g('Inorganic Chemistry', 'Inorganic', 'The oxidation state of Mn in KMnO4 is:', ['+7', '+4', '+2', '0'], 'K(+1) + Mn + 4O(-2) = 0 gives Mn = +7.'),
  g('Physical Chemistry', 'Physical', 'At equal T and P, the gas with the highest effusion rate is:', ['The lightest gas (H2)', 'CO2', 'O2', 'Cl2'], 'Graham law: lighter gases effuse faster.'),
  g('Physical Chemistry', 'Physical', 'If [OH-] = 1e-3 M, then pOH and pH are:', ['pOH 3 and pH 11', 'pOH 11 and pH 3', 'pOH 7', 'pOH 14'], 'pOH = -log(1e-3) = 3; pH = 14 - 3 = 11.'),
  g('Organic Chemistry', 'Organic', 'Zaitsev elimination of 2-bromobutane mainly yields:', ['2-butene', '1-butene', 'Butane', 'Isobutene'], 'The more substituted alkene is favored.'),
  g('Physical Chemistry', 'Physical', 'A solution of pH 4.0 has [H+] equal to:', ['1e-4 M', '1e-10 M', '1e-7 M', '1e-14 M'], 'pH = -log[H+], so [H+] = 1e-4 M.'),
  g('Physical Chemistry', 'Physical', 'Adding a catalyst to a reaction at equilibrium:', ['Does not shift the position', 'Shifts it right', 'Shifts it left', 'Ends the reaction'], 'A catalyst speeds both directions equally.'),
  g('Inorganic Chemistry', 'Inorganic', 'The molecular geometry of BF3 is:', ['Trigonal planar', 'Tetrahedral', 'Bent', 'Linear'], 'Three bonds and no lone pair on B give trigonal planar.'),
  g('Physical Chemistry', 'Physical', 'Electrolysis of molten NaCl produces which gas at the anode?', ['Chlorine gas', 'Hydrogen', 'Sodium metal', 'Oxygen'], 'Cl- is oxidized to Cl2 at the anode.'),
  g('Physical Chemistry', 'Physical', 'A salt of a weak acid and strong base in water is:', ['Basic', 'Acidic', 'Neutral', 'Amphoteric'], 'The conjugate base hydrolyzes to give OH-.'),
  g('Physical Chemistry', 'Physical', 'Burning 4 g of H2 needs how much O2? (2H2 + O2 -> 2H2O)', ['32 g', '16 g', '8 g', '64 g'], '4 g H2 = 2 mol needs 1 mol O2 = 32 g.'),
  g('Inorganic Chemistry', 'Inorganic', 'The hybridization of the central atom in BeCl2 is:', ['sp', 'sp2', 'sp3', 'sp3d'], 'Two electron domains give linear sp.'),
  g('Physical Chemistry', 'Physical', 'If a sparingly soluble salt exceeds its Ksp, the result is:', ['Precipitation', 'Dissolution', 'No change', 'Evaporation'], 'Supersaturation causes precipitation.')
];

const physics = [
  g('Mechanics', 'Physics', 'A body falling freely from rest for 2 s (g = 10 m/s2) travels:', ['20 m', '10 m', '40 m', '5 m'], 's = 1/2 g t^2 = 1/2 * 10 * 4 = 20 m.'),
  g('Mechanics', 'Physics', 'A 2 kg mass accelerated at 3 m/s2 requires a force of:', ['6 N', '5 N', '0.67 N', '9 N'], 'F = ma = 2 * 3 = 6 N.'),
  g('Waves', 'Physics', 'If wave frequency doubles while speed is fixed, the wavelength:', ['Halves', 'Doubles', 'Stays the same', 'Quadruples'], 'v = f lambda, so lambda = v/f.'),
  g('Optics', 'Physics', 'A convex lens forms a real inverted image when the object is:', ['Beyond the focal length', 'At the focus', 'Inside the focal length', 'At infinity only'], 'Beyond F, a convex lens gives a real image.'),
  g('Electricity', 'Physics', 'If resistance doubles in a fixed-voltage circuit, the current:', ['Halves', 'Doubles', 'Stays the same', 'Becomes zero'], 'I = V/R, so current halves.'),
  g('Mechanics', 'Physics', 'The work done by a 10 N force moving 5 m in its direction is:', ['50 J', '2 J', '15 J', '0.5 J'], 'W = F d = 10 * 5 = 50 J.'),
  g('Mechanics', 'Physics', 'An object in uniform circular motion has acceleration:', ['Directed toward the center', 'Zero', 'Directed outward', 'Constant and tangential'], 'Centripetal acceleration points inward.'),
  g('Waves', 'Physics', 'If slit width in diffraction decreases, the central maximum:', ['Widens', 'Narrows', 'Vanishes', 'Stays the same'], 'A smaller slit gives wider diffraction.'),
  g('Electricity', 'Physics', 'A 60 W bulb at 120 V draws a current of:', ['0.5 A', '2 A', '0.6 A', '5 A'], 'I = P/V = 60/120 = 0.5 A.'),
  g('Mechanics', 'Physics', 'If the mass of a spring oscillator doubles, its period:', ['Increases by a factor of root 2', 'Halves', 'Stays the same', 'Doubles'], 'T is proportional to the square root of mass.'),
  g('Optics', 'Physics', 'The focal length of a plane mirror is:', ['Infinity', '0', 'Equal to its radius', '-f'], 'A plane mirror has an infinite focal length.'),
  g('Electricity', 'Physics', 'Two resistors, 4 ohm and 6 ohm, in parallel give a total of:', ['2.4 ohm', '10 ohm', '5 ohm', '24 ohm'], '1/R = 1/4 + 1/6 = 5/12, so R = 2.4 ohm.'),
  g('Waves', 'Physics', 'A sound wave is classified as:', ['Longitudinal', 'Transverse', 'Electromagnetic', 'Stationary only'], 'Sound propagates as a longitudinal wave.'),
  g('Mechanics', 'Physics', 'If a body moves with constant velocity, the net force on it is:', ['Zero', 'Equal to its weight', 'Increasing', 'Unbounded'], 'Newton I: no net force for constant velocity.')
];

const mentalAgility = [
  g('Logical Reasoning', 'Mental Agility', 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are:', ['Lazzies', 'Razzies only', 'Not Lazzies', 'None of these'], 'Inclusion is transitive.'),
  g('Pattern Recognition', 'Mental Agility', 'The sequence 2, 4, 8, 16, ? continues with:', ['32', '30', '24', '20'], 'Each term doubles.'),
  g('Quantitative', 'Mental Agility', 'At 3:15, the angle between the clock hands is:', ['7.5 degrees', '90 degrees', '0 degrees', '15 degrees'], 'Minute hand at 90 deg, hour hand at 97.5 deg.'),
  g('Spatial', 'Mental Agility', 'A man walks 3 km north then 4 km east; his straight-line displacement is:', ['5 km', '7 km', '1 km', '12 km'], 'A 3-4-5 right triangle gives 5 km.'),
  g('Logical Reasoning', 'Mental Agility', 'If some A are B and no B are C, then some A are:', ['Not C', 'All C', 'C only', 'None of these'], 'The A that are B cannot be C.'),
  g('Quantitative', 'Mental Agility', 'For ranks A > B > C > D > E, the median is:', ['C', 'A', 'E', 'B'], 'The middle of five ordered items is C.'),
  g('Spatial', 'Mental Agility', 'A painted cube cut into 27 small cubes has unpainted interior cubes:', ['1', '8', '6', '0'], 'Only the single center cube is unpainted.'),
  g('Quantitative', 'Mental Agility', 'If today is Monday, 100 days later the day is:', ['Wednesday', 'Tuesday', 'Thursday', 'Monday'], '100 mod 7 = 2, so Monday + 2 = Wednesday.')
];

const health = [
  g('Epidemiology', 'Public Health', 'If the crude death rate rises but the age-adjusted rate falls, the likely cause is:', ['Population aging', 'An epidemic', 'A war', 'Better care'], 'Aging raises the crude but not the adjusted rate.'),
  g('Epidemiology', 'Public Health', 'A screening test with high sensitivity is best used for:', ['Ruling out disease', 'Ruling in disease', 'Definite diagnosis', 'Replacing the gold standard'], 'High sensitivity helps rule out (SnOUT).'),
  g('Epidemiology', 'Public Health', 'A vaccine with 95% efficacy: in 1000 vaccinated vs 1000 placebo with 20 placebo cases, expected vaccinated cases are about:', ['1', '20', '95', '0'], 'A 95% reduction leaves about 5% of 20 = 1.'),
  g('Biostatistics', 'Public Health', 'An odds ratio of 2.0 in a case-control study means:', ['Doubled odds of exposure', 'Halved risk', 'No association', 'A protective effect'], 'OR > 1 indicates increased odds.'),
  g('Public Health', 'Public Health', 'Improving sanitation first reduces:', ['Waterborne/enteric diseases', 'Airborne diseases', 'Chronic diseases', 'Genetic diseases'], 'Sanitation cuts fecal-oral transmission.'),
  g('Epidemiology', 'Public Health', 'A confounder must be associated with both:', ['Exposure and outcome', 'Outcome only', 'Exposure only', 'Neither'], 'A confounder relates to both.'),
  g('Demography', 'Public Health', 'A demographic dividend occurs when a country has:', ['A growing working-age share', 'More elderly', 'Fewer births only', 'A stable population'], 'A working-age bulge aids growth.'),
  g('Health Policy', 'Public Health', 'Taxing tobacco most directly targets:', ['Demand reduction', 'Supply only', 'A cure', 'Herd immunity'], 'Price rises reduce demand.'),
  g('Maternal Health', 'Public Health', 'If maternal mortality falls after skilled birth attendance rises, the link is:', ['Improved intrapartum care', 'Coincidence only', 'Genetics', 'Climate'], 'Skilled care prevents delivery deaths.'),
  g('Biostatistics', 'Public Health', 'Positive predictive value depends strongly on:', ['Prevalence', 'Sensitivity only', 'Specificity only', 'Sample size'], 'PPV rises as prevalence rises.')
];

const nursing = [
  g('Adult Health Nursing', 'Nursing', 'A postoperative patient with pulse 120, BP 90/60 and cold clammy skin suggests:', ['Hypovolemic shock', 'A calm state', 'A stroke', 'Anxiety only'], 'Tachycardia with hypotension indicates shock.'),
  g('Pharmacology', 'Nursing', 'A patient on warfarin should be monitored with:', ['INR', 'aPTT', 'Platelet count', 'Bleeding time'], 'INR monitors warfarin anticoagulation.'),
  g('Gastrointestinal Nursing', 'Nursing', 'If NG tube aspirate is bilious after GI surgery, the nurse should:', ['Assess for obstruction', 'Feed immediately', 'Remove the tube', 'Ignore it'], 'Bilious aspirate suggests obstruction.'),
  g('Endocrine Nursing', 'Nursing', 'A diabetic with fruity breath and Kussmaul breathing shows:', ['Diabetic ketoacidosis', 'Hypoglycemia', 'Asthma', 'CHF'], 'Kussmaul breathing indicates DKA.'),
  g('Pharmacology', 'Nursing', 'A patient with urticaria and wheeze after a drug needs:', ['Epinephrine', 'An antibiotic', 'An antacid', 'A sedative'], 'These signs indicate anaphylaxis.'),
  g('Safety', 'Nursing', 'A fall-risk patient should have:', ['A bed alarm and a low bed', 'Restraints always', 'Nothing changed', 'Lights kept off'], 'Non-restraint precautions reduce falls.'),
  g('Transfusion', 'Nursing', 'If a transfusion reaction occurs with fever and chills, the first action is to:', ['Stop the transfusion', 'Slow it down', 'Continue it', 'Give aspirin'], 'Stopping the transfusion is first.'),
  g('Respiratory Nursing', 'Nursing', 'A COPD patient with rising CO2 should receive oxygen:', ['Titrated to a low concentration', 'At 100% high flow', 'Not at all', 'Hyperbaric'], 'Low FiO2 avoids CO2 narcosis.'),
  g('Urinary Nursing', 'Nursing', 'Cloudy catheter urine with sediment suggests:', ['A catheter-associated UTI', 'Dehydration only', 'A normal finding', 'Stones only'], 'Cloudy urine indicates infection.'),
  g('Maternal Nursing', 'Nursing', 'A postpartum woman with heavy lochia and a boggy uterus needs:', ['Fundal massage', 'Discharge', 'Fluids only', 'Bed rest'], 'A boggy uterus requires massage.'),
  g('Pediatric Nursing', 'Nursing', 'A child with stridor and a lean-forward posture needs the nurse to prioritize:', ['Airway', 'Feeding', 'Bathing', 'Play'], 'Airway comes first in croup.'),
  g('Cardiac Nursing', 'Nursing', 'Chest pain radiating to the left arm with diaphoresis suggests:', ['Possible myocardial infarction', 'Indigestion only', 'Anxiety only', 'Muscle strain'], 'These are classic MI signs.'),
  g('Infection Control', 'Nursing', 'Breaking aseptic technique during a dressing change risks:', ['Infection', 'Faster healing', 'Bleeding', 'No risk'], 'A breach invites infection.'),
  g('Pharmacology', 'Nursing', 'A dry cough on an ACE inhibitor is due to:', ['Bradykinin accumulation', 'Infection', 'Allergy', 'Pneumonia'], 'ACE inhibitors raise bradykinin.'),
  g('Renal Nursing', 'Nursing', 'Urine output < 0.5 mL/kg/h for 6 h should flag:', ['Acute kidney injury', 'Dehydration only', 'A normal value', 'Overhydration'], 'Oliguria signals AKI.'),
  g('Wound Care', 'Nursing', 'A burn with blistering and pain in the superficial dermis is:', ['Superficial partial-thickness', 'Full thickness', 'Erythema only', 'Deep'], 'Painful blisters mark superficial partial-thickness.'),
  g('Perioperative', 'Nursing', 'A patient who is NPO before surgery needs the nurse to ensure:', ['IV access and hydration', 'Oral feeding', 'Water only', 'Nothing done'], 'NPO status needs IV support.'),
  g('Neuro Nursing', 'Nursing', 'During a seizure, the patient should be placed:', ['On the side with a clear airway', 'Supine and restrained', 'Feeding', 'In bright light'], 'Recovery position; never restrain.')
];

module.exports = { zoology, botany, chemistry, physics, mentalAgility, health, nursing };
