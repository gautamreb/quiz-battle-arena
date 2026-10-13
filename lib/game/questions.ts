export type Question = { id: number; category: string; text: string; choices: string[]; correct: number };
const rows: [string,string,string,string,string,string][] = [
['SCIENCE','Which planet is known as the Red Planet?','Mars','Venus','Jupiter','Mercury'],
['GEOGRAPHY','What is the capital of Japan?','Tokyo','Kyoto','Osaka','Seoul'],
['NATURE','How many legs does an insect have?','Six','Four','Eight','Ten'],
['SCIENCE','What is the chemical symbol for gold?','Au','Ag','Fe','Go'],
['WORLD','Which is the largest ocean on Earth?','Pacific','Atlantic','Indian','Arctic'],
['ARTS','Who painted the Mona Lisa?','Leonardo da Vinci','Vincent van Gogh','Pablo Picasso','Claude Monet'],
['SPORT','How many players does a soccer team field at the start of a match?','11','9','10','12'],
['SCIENCE','Which gas do plants absorb during photosynthesis?','Carbon dioxide','Oxygen','Helium','Hydrogen'],
['FOOD','Which fruit is traditionally used to make guacamole?','Avocado','Mango','Lime','Papaya'],
['SPACE','What is the closest star to Earth?','The Sun','Sirius','Polaris','Proxima Centauri'],
['NUMBERS','What is 12 multiplied by 8?','96','86','108','88'],
['NATURE','Which is the largest living animal?','Blue whale','African elephant','Giraffe','Whale shark'],
['HISTORY','In which country are the pyramids of Giza?','Egypt','Greece','Mexico','Peru'],
['BOOKS','Who wrote Romeo and Juliet?','William Shakespeare','Charles Dickens','Jane Austen','Mark Twain'],
['GEOGRAPHY','On which continent is Brazil?','South America','Africa','Europe','North America'],
['SCIENCE','At sea level, what is the boiling point of pure water in Celsius?','100°C','90°C','110°C','80°C'],
['MUSIC','How many strings does a standard violin have?','Four','Five','Six','Three'],
['WORLD','Which language is primarily spoken in Brazil?','Portuguese','Spanish','French','Italian'],
['NATURE','What do caterpillars transform into?','Butterflies or moths','Beetles','Dragonflies','Grasshoppers'],
['SPORT','In tennis, what word means a score of zero?','Love','Nil','Blank','Duck'],
['SCIENCE','Which organ pumps blood around the body?','Heart','Liver','Lungs','Kidneys'],
['GEOGRAPHY','What is the capital of France?','Paris','Rome','Madrid','Berlin'],
['NUMBERS','How many sides does a hexagon have?','Six','Five','Seven','Eight'],
['FOOD','Which ingredient makes bread dough rise in traditional yeast bread?','Yeast','Salt','Oil','Sugar alone'],
['SPACE','Which planet has the most prominent ring system?','Saturn','Mars','Earth','Venus'],
['ARTS','What color do blue and yellow paint usually make when mixed?','Green','Orange','Purple','Red'],
['HISTORY','Which ancient civilization built the Colosseum?','Romans','Vikings','Aztecs','Persians'],
['NATURE','Which animal is a mammal?','Dolphin','Shark','Octopus','Trout'],
['SCIENCE','What is the hardest natural mineral on the Mohs scale?','Diamond','Quartz','Ruby','Talc'],
['GEOGRAPHY','Which country has the cities Sydney and Melbourne?','Australia','New Zealand','Canada','South Africa'],
['SPORT','Which sport uses a shuttlecock?','Badminton','Squash','Tennis','Table tennis'],
['BOOKS','In the fairy tale, what does Cinderella lose at the ball?','A glass slipper','A necklace','A crown','A glove'],
['NUMBERS','What is the square root of 81?','9','8','7','6'],
['MUSIC','Which instrument has black and white keys?','Piano','Flute','Trumpet','Cello'],
['SCIENCE','Which force keeps planets in orbit around the Sun?','Gravity','Friction','Magnetism alone','Buoyancy'],
['WORLD','Which country is shaped like a boot on a map?','Italy','Portugal','Norway','India'],
['NATURE','What is a group of lions commonly called?','A pride','A pod','A school','A colony'],
['FOOD','Tofu is usually made from which bean?','Soybean','Kidney bean','Chickpea','Black bean'],
['SPACE','Who was the first person to walk on the Moon?','Neil Armstrong','Yuri Gagarin','Buzz Aldrin','John Glenn'],
['GEOGRAPHY','Which mountain is the highest above sea level?','Mount Everest','K2','Kilimanjaro','Mont Blanc'],
];
export const questions: Question[] = rows.map((r,id)=>({id,category:r[0],text:r[1],choices:r.slice(2),correct:0}));
export function shuffle<T>(items:T[]):T[] { const a=[...items];for(let i=a.length-1;i>0;i--){const n=new Uint32Array(1);crypto.getRandomValues(n);const j=n[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a; }
export function pickQuestions(previous:number[]=[]):Question[]{
 const fresh=shuffle(questions.filter(q=>!previous.includes(q.id)));
 const pool=[...fresh,...shuffle(questions.filter(q=>previous.includes(q.id)))].slice(0,10);
 return pool.map(q=>{const order=shuffle([0,1,2,3]);return {...q,choices:order.map(i=>q.choices[i]),correct:order.indexOf(q.correct)};});
}
