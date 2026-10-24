// Primary Science content bank (MOE themes: Diversity, Cycles, Systems, Energy, Interactions).
// MCQ items store the correct option first (`a`) and the wrong ones (`w`); the player shuffles them.

export const THEMES = ['Diversity', 'Cycles', 'Systems', 'Energy', 'Interactions'];

export const MCQ = [
  // ---- Diversity ----
  { th: 'Diversity', t: 'Living vs non-living', q: 'Which of these is a characteristic of ALL living things?', a: 'They reproduce', w: ['They can fly', 'They have a backbone', 'They live on land'], e: 'All living things respond to stimuli, need food/energy, grow, and reproduce.' },
  { th: 'Diversity', t: 'Classification', q: 'Which group of animals has a backbone?', a: 'Fish, amphibians, reptiles, birds, mammals', w: ['Worms, snails, spiders', 'Insects and spiders only', 'Snails and crabs'], e: 'Vertebrates have a backbone. Worms, snails, spiders and insects are invertebrates.' },
  { th: 'Diversity', t: 'Classification', q: 'A bat is classified as a mammal because it…', a: 'has hair and feeds its young with milk', w: ['can fly', 'lays eggs', 'lives in caves'], e: 'Mammals have hair/fur and nurse young with milk. Flying is not what defines a mammal.' },
  { th: 'Diversity', t: 'Plants', q: 'Which plant group reproduces using spores?', a: 'Ferns', w: ['Hibiscus', 'Mango tree', 'Bean plant'], e: 'Ferns, mosses and fungi reproduce by spores. Flowering plants make seeds.' },
  { th: 'Diversity', t: 'Materials', q: 'Which property makes copper suitable for electrical wires?', a: 'It is a good conductor of electricity', w: ['It is magnetic', 'It floats on water', 'It is transparent'], e: 'Metals like copper let electric current flow easily and can be drawn into wires.' },
  { th: 'Diversity', t: 'Materials', q: 'Why are cooking pots made of metal with plastic handles?', a: 'Metal is a good conductor of heat and plastic is a poor conductor of heat', w: ['Plastic is magnetic', 'Metal is a poor conductor of heat', 'Plastic is heavier than metal'], e: 'The metal pot heats the food quickly, while the plastic handle stays cool to hold.' },
  { th: 'Diversity', t: 'Matter', q: 'Which of these has a definite volume but NO definite shape?', a: 'Water in a bottle', w: ['A stone', 'Air in a balloon', 'A wooden block'], e: 'Liquids keep their volume but take the shape of the container. Gases fill the container; solids keep shape.' },
  { th: 'Diversity', t: 'Matter', q: 'Which statement about gases is correct?', a: 'They have no fixed shape and can be compressed', w: ['They have a fixed volume', 'They cannot be compressed', 'They do not take up space'], e: 'Gas particles are far apart, so a gas can be squeezed into a smaller space.' },

  // ---- Cycles ----
  { th: 'Cycles', t: 'Water cycle', q: 'What happens during condensation?', a: 'Water vapour cools and changes into tiny water droplets', w: ['Water changes to water vapour', 'Water droplets freeze into ice', 'Ice melts into water'], e: 'Condensation = gas → liquid, when water vapour loses heat.' },
  { th: 'Cycles', t: 'Water cycle', q: 'Which process changes liquid water into water vapour?', a: 'Evaporation', w: ['Condensation', 'Freezing', 'Melting'], e: 'Evaporation: liquid → gas, as the water gains heat.' },
  { th: 'Cycles', t: 'Water cycle', q: 'Wet clothes dry fastest on a…', a: 'warm, dry and windy day', w: ['cool, humid and still day', 'warm, humid and still day', 'cool, dry and still day'], e: 'Heat, dry air and moving air all increase the rate of evaporation.' },
  { th: 'Cycles', t: 'Water cycle', q: 'Water droplets form on the outside of a cold glass of iced water because…', a: 'water vapour in the air loses heat to the cold glass and condenses', w: ['water seeps through the glass', 'the glass is leaking', 'the cold glass makes water vapour'], e: 'Warm water vapour in the air touches the cold surface and condenses.' },
  { th: 'Cycles', t: 'Change of state', q: 'A puddle of water is left in the sun. After a few hours it disappears. Which process happened?', a: 'Evaporation', w: ['Melting', 'Condensation', 'Freezing'], e: 'The water gained heat from the Sun and turned into water vapour.' },
  { th: 'Cycles', t: 'Life cycle', q: 'Which animal has a life cycle with a pupa stage?', a: 'Butterfly', w: ['Cockroach', 'Frog', 'Chicken'], e: 'Butterflies undergo complete metamorphosis: egg → larva → pupa → adult. Cockroaches skip the pupa (egg → nymph → adult).' },
  { th: 'Cycles', t: 'Life cycle', q: 'Which animal’s young (a tadpole) breathes through gills?', a: 'Frog', w: ['Cockroach', 'Chicken', 'Butterfly'], e: 'Frog tadpoles live in water and have gills; adult frogs have lungs.' },
  { th: 'Cycles', t: 'Life cycle', q: 'In the life cycle of a mosquito, the egg, larva and pupa stages live…', a: 'in water', w: ['on leaves', 'in soil', 'in the air'], e: 'Mosquitoes breed in stagnant water – so remove water from pots and drains weekly to stop dengue.' },
  { th: 'Cycles', t: 'Plant reproduction', q: 'Pollination happens when pollen is transferred from the…', a: 'anther to the stigma', w: ['stigma to the anther', 'ovary to the stigma', 'petal to the ovary'], e: 'Pollen is made in the anther (male) and lands on the stigma (female).' },
  { th: 'Cycles', t: 'Plant reproduction', q: 'After fertilisation in a flower, the ovule develops into a…', a: 'seed', w: ['fruit', 'petal', 'stigma'], e: 'The ovule becomes the seed; the ovary becomes the fruit.' },
  { th: 'Cycles', t: 'Plant reproduction', q: 'Which of these is a way seeds are dispersed by wind?', a: 'Having wing-like parts or light fluffy hairs', w: ['Having a sweet juicy fruit', 'Having hooks to stick to fur', 'Having a hard, heavy shell'], e: 'Wing-like or hairy seeds (e.g., dandelion, angsana) are light and travel on air currents.' },
  { th: 'Cycles', t: 'Plant reproduction', q: 'Which conditions are needed for a seed to germinate?', a: 'Water, oxygen and suitable warmth', w: ['Sunlight, soil and carbon dioxide', 'Light, minerals and wind', 'Soil, fertiliser and water'], e: 'Seeds need water, air (oxygen) and warmth. Light and soil are not needed to start germinating.' },
  { th: 'Cycles', t: 'Human reproduction', q: 'In humans, fertilisation takes place when…', a: 'a sperm cell joins an egg cell', w: ['an egg cell joins an egg cell', 'a sperm cell joins a body cell', 'a baby is born'], e: 'Fertilisation = the nucleus of a sperm fuses with the egg, forming a zygote.' },

  // ---- Systems ----
  { th: 'Systems', t: 'Plant system', q: 'Which part of a plant carries water from the roots to the leaves?', a: 'Xylem vessels', w: ['Phloem tubes', 'Stomata', 'Petioles only'], e: 'Xylem: water and minerals up. Phloem: food (sugar) around the plant.' },
  { th: 'Systems', t: 'Plant system', q: 'What is the main function of the roots?', a: 'To absorb water and mineral salts and hold the plant in the soil', w: ['To make food', 'To produce seeds', 'To let out water vapour'], e: 'Leaves make food; roots absorb water and anchor the plant.' },
  { th: 'Systems', t: 'Plant system', q: 'Through which tiny openings does a leaf take in carbon dioxide?', a: 'Stomata', w: ['Veins', 'Roots hairs', 'Xylem'], e: 'Stomata (mostly under the leaf) let gases in and out.' },
  { th: 'Systems', t: 'Digestive system', q: 'In which organ does most digestion and absorption of digested food take place?', a: 'Small intestine', w: ['Stomach', 'Large intestine', 'Gullet'], e: 'The small intestine has a very long, folded wall. Digested food passes into the blood. The large intestine absorbs water.' },
  { th: 'Systems', t: 'Digestive system', q: 'Which is the correct order of the path of food?', a: 'Mouth → gullet → stomach → small intestine → large intestine', w: ['Mouth → stomach → gullet → small intestine → large intestine', 'Mouth → gullet → small intestine → stomach → large intestine', 'Mouth → gullet → stomach → large intestine → small intestine'], e: 'Remember: Mouth, Gullet, Stomach, Small intestine, Large intestine, Anus.' },
  { th: 'Systems', t: 'Digestive system', q: 'What happens to food in the mouth?', a: 'It is broken into smaller pieces by teeth and mixed with saliva', w: ['It is completely digested', 'It is absorbed into the blood', 'Water is removed from it'], e: 'Chewing is physical digestion; saliva starts digesting starch.' },
  { th: 'Systems', t: 'Respiratory system', q: 'During breathing in (inhaling), the ribcage…', a: 'moves up and out', w: ['moves down and in', 'does not move', 'moves up and in'], e: 'When the ribcage moves up and out and the diaphragm flattens, the chest gets bigger and air rushes in.' },
  { th: 'Systems', t: 'Respiratory system', q: 'Where does gas exchange between the air and the blood take place?', a: 'Air sacs in the lungs', w: ['Windpipe', 'Nose', 'Heart'], e: 'Oxygen passes from air sacs into the blood, and carbon dioxide passes out.' },
  { th: 'Systems', t: 'Circulatory system', q: 'What is the main function of the heart?', a: 'To pump blood around the body', w: ['To clean the blood', 'To make oxygen', 'To digest food'], e: 'The heart is a muscular pump.' },
  { th: 'Systems', t: 'Circulatory system', q: 'Which blood vessels carry blood away from the heart?', a: 'Arteries', w: ['Veins', 'Capillaries only', 'Lymph vessels'], e: 'Arteries carry blood Away; veins bring it back.' },
  { th: 'Systems', t: 'Circulatory system', q: 'Which part of the blood carries oxygen?', a: 'Red blood cells', w: ['White blood cells', 'Plasma only', 'Platelets'], e: 'Red blood cells contain haemoglobin which carries oxygen. White blood cells fight germs.' },
  { th: 'Systems', t: 'Electrical systems', q: 'In a simple circuit, a bulb will light up only if…', a: 'there is a complete closed path with a battery', w: ['the switch is open', 'there is a gap in the circuit', 'there is no battery'], e: 'Current flows only in a closed loop.' },
  { th: 'Systems', t: 'Electrical systems', q: 'Which of these is an electrical insulator?', a: 'Rubber', w: ['Iron', 'Copper', 'Aluminium foil'], e: 'Rubber, plastic, wood and glass are insulators. Metals are conductors.' },
  { th: 'Systems', t: 'Electrical systems', q: 'Bulbs are connected in series. If one bulb fuses (breaks), what happens to the other bulbs?', a: 'They all go off', w: ['They stay on', 'They become brighter', 'Only the next one goes off'], e: 'A series circuit has just one path; breaking it anywhere stops the current.' },
  { th: 'Systems', t: 'Electrical systems', q: 'Why are homes wired in parallel?', a: 'So each appliance works independently of the others', w: ['So that all appliances turn off together', 'So that it uses less electricity', 'Because wires are cheaper'], e: 'In a parallel circuit, each branch has its own path to the battery/supply.' },

  // ---- Energy ----
  { th: 'Energy', t: 'Light', q: 'We can see a non-luminous object (like a book) because…', a: 'light is reflected from it into our eyes', w: ['it makes its own light', 'light is absorbed by it', 'our eyes send out light'], e: 'Luminous objects (Sun, torch) give out light. Others reflect light into our eyes.' },
  { th: 'Energy', t: 'Light', q: 'Which material will form the darkest shadow?', a: 'A wooden board', w: ['Clear glass', 'Tracing paper', 'A clear plastic sheet'], e: 'Opaque materials block all light; translucent ones let some through; transparent ones let most through.' },
  { th: 'Energy', t: 'Light', q: 'A shadow becomes bigger when the object is moved…', a: 'closer to the light source', w: ['further from the light source', 'closer to the screen only', 'to the side'], e: 'The closer the object is to the light source, the larger the shadow.' },
  { th: 'Energy', t: 'Heat', q: 'Heat always flows from…', a: 'a hotter object to a colder object', w: ['a colder object to a hotter object', 'a bigger object to a smaller object', 'a heavier object to a lighter object'], e: 'Heat gain → temperature rises; heat loss → temperature drops, until both are equal.' },
  { th: 'Energy', t: 'Heat', q: 'When a metal ball is heated, it…', a: 'expands', w: ['contracts', 'stays the same size', 'becomes lighter'], e: 'Most matter expands when heated and contracts when cooled.' },
  { th: 'Energy', t: 'Heat', q: 'Which of the following is the best material for keeping a drink hot?', a: 'A vacuum flask', w: ['A metal can', 'A glass cup', 'A thin plastic cup'], e: 'A vacuum flask has a gap with no air, so very little heat is lost by conduction or convection.' },
  { th: 'Energy', t: 'Photosynthesis', q: 'Which of the following does a plant need to make food by photosynthesis?', a: 'Light, water and carbon dioxide', w: ['Oxygen and sugar', 'Soil and oxygen', 'Light and oxygen'], e: 'Plants make sugar (food) and give out oxygen.' },
  { th: 'Energy', t: 'Photosynthesis', q: 'A plant is kept in a dark cupboard for a week. Its leaves turn yellow because…', a: 'it cannot make chlorophyll or food without light', w: ['it has too much water', 'it has too much oxygen', 'its roots grow too long'], e: 'Without light, photosynthesis stops and chlorophyll (the green pigment) is not maintained.' },
  { th: 'Energy', t: 'Energy conversion', q: 'Which energy conversion takes place in a battery-operated fan?', a: 'Chemical potential → electrical → kinetic energy', w: ['Kinetic → chemical → light', 'Light → kinetic → sound', 'Heat → electrical → chemical'], e: 'The battery stores chemical energy, which becomes electrical and then kinetic (moving blades).' },
  { th: 'Energy', t: 'Energy conversion', q: 'What is the main energy conversion in a solar panel?', a: 'Light energy → electrical energy', w: ['Heat → light', 'Kinetic → chemical', 'Electrical → light'], e: 'Photovoltaic cells convert light to electricity.' },
  { th: 'Energy', t: 'Energy conversion', q: 'A stretched rubber band, when released, shoots forward. Its elastic potential energy is converted mainly to…', a: 'kinetic energy', w: ['gravitational potential energy only', 'chemical energy', 'light energy'], e: 'Stored energy → movement.' },

  // ---- Interactions ----
  { th: 'Interactions', t: 'Forces', q: 'Friction acts…', a: 'in the direction opposite to the motion', w: ['in the same direction as the motion', 'upwards only', 'sideways only'], e: 'Friction opposes motion or attempted motion between surfaces.' },
  { th: 'Interactions', t: 'Forces', q: 'Which surface produces the LEAST friction for a toy car?', a: 'Smooth glass', w: ['Carpet', 'Sandpaper', 'Rough concrete'], e: 'Smoother surfaces mean less friction.' },
  { th: 'Interactions', t: 'Forces', q: 'What does gravity do to a ball thrown upwards?', a: 'It pulls the ball downwards, slowing it down and bringing it back', w: ['It pushes the ball upwards', 'It has no effect', 'It makes the ball float'], e: 'Gravity is a pull force toward the Earth’s centre.' },
  { th: 'Interactions', t: 'Forces', q: 'A force can NOT…', a: 'change the mass of an object', w: ['change the shape of an object', 'change the speed of an object', 'change the direction of motion of an object'], e: 'Forces change shape, speed and direction – not mass.' },
  { th: 'Interactions', t: 'Magnets', q: 'Which pair of magnetic poles will attract each other?', a: 'North and South', w: ['North and North', 'South and South', 'None of these'], e: 'Unlike poles attract; like poles repel.' },
  { th: 'Interactions', t: 'Magnets', q: 'Which of these is attracted to a magnet?', a: 'A steel paper clip', w: ['A copper coin', 'A rubber band', 'A plastic ruler'], e: 'Magnetic materials include iron, steel, cobalt and nickel.' },
  { th: 'Interactions', t: 'Environment', q: 'In the food chain: grass → grasshopper → frog → snake, which organism is the producer?', a: 'Grass', w: ['Grasshopper', 'Frog', 'Snake'], e: 'Producers (green plants) make their own food. The arrow means "is eaten by".' },
  { th: 'Interactions', t: 'Environment', q: 'In the same food chain, if the frogs all die, what is MOST likely to happen immediately?', a: 'The number of grasshoppers increases and snakes may have less food', w: ['The number of grasshoppers decreases', 'The number of snakes increases', 'The grass increases'], e: 'Fewer predators of grasshoppers → more grasshoppers. Snakes lose a food source.' },
  { th: 'Interactions', t: 'Environment', q: 'A cactus has thick stems and spines. These adaptations help it to…', a: 'store water and reduce water loss', w: ['absorb more sunlight', 'attract insects', 'float on water'], e: 'Adaptations help organisms survive in their habitat – the desert is dry.' },
  { th: 'Interactions', t: 'Environment', q: 'Which of these is a way humans can reduce pollution?', a: 'Recycling and using public transport', w: ['Burning more rubbish', 'Using more disposable plastic', 'Cutting down more forests'], e: 'The 3Rs (Reduce, Reuse, Recycle) and fewer car trips help the environment.' },
  { th: 'Interactions', t: 'Environment', q: 'Mangrove roots that stick out of the mud help the plant to…', a: 'take in air in waterlogged, oxygen-poor soil', w: ['store water', 'attract bees', 'make food'], e: 'Mangrove swamps are muddy and low in oxygen; aerial roots take in air.' },
];

// Open-ended practice using the CER framework: Claim, Evidence, Reasoning.
export const OPEN = [
  { th: 'Energy', q: 'Amy placed two identical cups of hot water in a room. Cup A was covered with a lid; Cup B was not. After 30 minutes, Cup A was warmer. Explain why.', model: 'Cup B lost more heat to the surroundings by evaporation, because water vapour could escape. The lid on Cup A prevented the water vapour and the heat it carries from escaping, so Cup A lost less heat and stayed warmer.', keywords: ['evaporation', 'lid', 'heat loss', 'water vapour'] },
  { th: 'Cycles', q: 'A student left a wet towel on a balcony. Explain why it dried faster on a windy day than a calm day.', model: 'Wind carries away the water vapour near the towel, so more water can evaporate from the towel. The rate of evaporation increases, so the towel dries faster.', keywords: ['wind', 'evaporation', 'water vapour', 'rate'] },
  { th: 'Systems', q: 'A plant was placed near a window and its stem bent towards the light. Explain why this is useful to the plant.', model: 'The plant responds to light (a stimulus) by growing towards it. This lets its leaves receive more light for photosynthesis, so it can make more food to grow.', keywords: ['light', 'photosynthesis', 'leaves', 'food'] },
  { th: 'Interactions', q: 'Ben pushed a toy car on a smooth tiled floor and on a carpet with the same force. The car travelled further on the tiles. Explain why.', model: 'The tiles are smoother so there is less friction between the wheels and the floor. Less friction means the car slows down less quickly and travels further. The carpet is rougher and produces more friction.', keywords: ['friction', 'smooth', 'rough', 'slows down'] },
  { th: 'Energy', q: 'Why does a shadow of a tree get longer in the late afternoon?', model: 'As the Sun gets lower in the sky, light hits the tree at a smaller angle, so the shadow behind the tree becomes longer.', keywords: ['Sun', 'lower', 'angle', 'shadow'] },
  { th: 'Systems', q: 'Why do you breathe faster and deeper after running?', model: 'Your muscles need more energy, so they use more oxygen and produce more carbon dioxide. Breathing faster and deeper brings in more oxygen and removes the carbon dioxide more quickly.', keywords: ['muscles', 'oxygen', 'energy', 'carbon dioxide'] },
  { th: 'Interactions', q: 'A pond has algae, small fish and big fish. Many small fish die from a disease. State and explain what will happen to the number of algae and big fish.', model: 'The number of algae will increase because fewer small fish eat them. The number of big fish will decrease because there is less food (small fish) for them.', keywords: ['algae increase', 'less food', 'big fish decrease', 'food chain'] },
  { th: 'Cycles', q: 'Why is it important to remove stagnant water from flower pot plates every week?', model: 'Mosquitoes lay eggs in stagnant water. The eggs hatch into larvae and pupae in water. Removing the water breaks the life cycle and prevents mosquitoes from breeding, reducing the chance of dengue.', keywords: ['mosquito', 'eggs', 'life cycle', 'dengue'] },
  { th: 'Diversity', q: 'Why are electrical wires covered with plastic?', model: 'Plastic is an electrical insulator. It stops electric current from flowing to the person touching it, which prevents electric shock, and stops short circuits between wires.', keywords: ['insulator', 'electric shock', 'current'] },
  { th: 'Energy', q: 'A metal spoon in hot soup becomes hot, but a wooden spoon does not get hot as quickly. Explain.', model: 'Metal is a good conductor of heat, so heat travels quickly from the soup along the spoon to your hand. Wood is a poor conductor of heat, so heat travels along it slowly.', keywords: ['conductor', 'heat', 'metal', 'wood'] },
  { th: 'Systems', q: 'Explain why green leaves turn pale when a plant is kept in the dark for many days.', model: 'Without light the plant cannot carry out photosynthesis and cannot make or keep chlorophyll, the green pigment. Without chlorophyll the leaves turn yellow or pale.', keywords: ['light', 'photosynthesis', 'chlorophyll'] },
  { th: 'Interactions', q: 'Why do we wear helmets when cycling?', model: 'In a fall, the helmet absorbs the force of the impact and spreads it over a larger area, reducing the force on the head and protecting the brain from injury.', keywords: ['force', 'impact', 'protect', 'head'] },
];

export const KEYWORDS = [
  ['Evaporation', 'Liquid changes to gas (water vapour) when it gains heat.'],
  ['Condensation', 'Gas (water vapour) changes to liquid when it loses heat.'],
  ['Conductor', 'A material that allows heat or electricity to pass through easily.'],
  ['Insulator', 'A material that does not allow heat or electricity to pass through easily.'],
  ['Photosynthesis', 'Green plants use light, water and carbon dioxide to make food (sugar) and give out oxygen.'],
  ['Stimulus', 'A change in surroundings that an organism responds to.'],
  ['Adaptation', 'A feature or behaviour that helps an organism survive in its habitat.'],
  ['Habitat', 'The place where a living thing lives.'],
  ['Producer', 'An organism that makes its own food (e.g., green plants).'],
  ['Consumer', 'An organism that eats other organisms for food.'],
  ['Predator', 'An animal that hunts and eats other animals.'],
  ['Germination', 'When a seed starts to grow into a young plant.'],
  ['Pollination', 'Transfer of pollen from the anther to the stigma.'],
  ['Fertilisation', 'The joining of a male sex cell and a female sex cell.'],
  ['Friction', 'A force that opposes motion between two surfaces in contact.'],
  ['Gravity', 'A force that pulls objects towards the centre of the Earth.'],
  ['Luminous', 'Gives out its own light (e.g., the Sun).'],
  ['Opaque', 'Does not let light pass through.'],
  ['Translucent', 'Lets some light pass through.'],
  ['Transparent', 'Lets most light pass through.'],
  ['Series circuit', 'Components in a single loop; one break stops everything.'],
  ['Parallel circuit', 'Components on separate branches; each works on its own path.'],
  ['Kinetic energy', 'Energy of moving objects.'],
  ['Potential energy', 'Stored energy (e.g., gravitational, elastic, chemical).'],
];

export const CER_FRAME = [
  ['Claim', 'Answer the question directly: "The ___ will …"'],
  ['Evidence', 'Use data from the question: "In the experiment, ___ happened."'],
  ['Reasoning', 'Link it to a science concept: "This is because ___."'],
];
