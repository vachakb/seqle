export const MATH_QUOTES: string[] = [
  '"Mathematics is the queen of the sciences." -- Carl Friedrich Gauss',
  '"Pure mathematics is, in its way, the poetry of logical ideas." -- Albert Einstein',
  '"Do not worry about your difficulties in mathematics. I can assure you mine are still greater." -- Albert Einstein',
  '"The essence of mathematics lies in its freedom." -- Georg Cantor',
  '"Mathematics knows no races or geographic boundaries." -- David Hilbert',
  '"In mathematics the art of proposing a question must be held of higher value than solving it." -- Georg Cantor',
  '"God made the integers; all else is the work of man." -- Leopold Kronecker',
  '"The only way to learn mathematics is to do mathematics." -- Paul Halmos',
  '"Mathematics is not about numbers, equations, or algorithms: it is about understanding." -- William Paul Thurston',
  '"A mathematician is a device for turning coffee into theorems." -- Alfred Renyi',
  '"Without mathematics, there is nothing you can do. Everything around you is mathematics." -- Shakuntala Devi',
  '"The book of nature is written in the language of mathematics." -- Galileo Galilei',
];

export function getInputEasterEgg(value: number): string | null {
  switch (value) {
    case 42:
      return "The Answer to the Ultimate Question of Life, the Universe, and Everything.";
    case 69:
      return "Nice.";
    case 420:
      return "Blaze it... mathematically.";
    case 1729:
      return "Hardy-Ramanujan number! The smallest expressible as the sum of two cubes in two ways.";
    case 666:
      return "The number of the beast... and a Smith number!";
    case 314:
      return "Looks like someone loves pi.";
    case 2718:
      return "Euler's number e, approximately.";
    case 1337:
      return "L33T math skills detected.";
    default:
      return null;
  }
}

export function checkGhostGuessPrank(
  value: number,
  ghostNumber: number | null,
): string | null {
  if (ghostNumber === null) return null;
  if (value === ghostNumber) {
    return "You thought it was that easy? It was a prank. Now look at the camera and say hello.";
  }
  return null;
}

