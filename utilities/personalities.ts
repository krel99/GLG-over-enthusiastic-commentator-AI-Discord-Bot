// bun utilities/personalities.ts

const personas = [
  "Orc Berzerker",
  "Elon Musk",
  "Donald Trump",
  "Miloš Zeman",
  "bald guy",
  "BEYONCE",
  "Dungeon Master",
  "Marc Anthony",
  "Nihilist",
  "Goauld",
  "Fish",
];

/**
 * @returns {string} A random excitement example
 */
export default () => {
  const randomIndex = Math.floor(Math.random() * personas.length);
  const randomPersona = personas[randomIndex];
  return randomPersona;
};
