// prettier-ignore

import boxen from 'boxen';
import chalk from 'chalk';

interface BannerProps {
  heading: string;
  description: string;
}

const HEX = '#2563eb';
const SPACER = 4;
const PADDING = 3;

const CHARACTER = '+';
const SPACE = ' ';

const PADDING_LINE = `${SPACE.repeat(15)}|`;
const OUTTER_LINE = `${SPACE.repeat(5)}${CHARACTER.repeat(7)}   |`;
const INNER_LINE = `${SPACE.repeat(PADDING)}${CHARACTER.repeat(2)}${SPACE}${CHARACTER.repeat(3)}      |`;
const MIDDLE_LINE = `${SPACE.repeat(PADDING)}${CHARACTER.repeat(4)}        |`;

const line = (text: string) => `${chalk.bold.hex(HEX)(text)}`;

export const printBanner = ({ heading, description }: BannerProps) =>
  console.log(
    boxen(
      `${line(PADDING_LINE)}
${line(OUTTER_LINE)}
${line(INNER_LINE)}${' '.repeat(SPACER)}${chalk.bold(heading)}${SPACE.repeat(PADDING)}
${line(MIDDLE_LINE)}
${line(INNER_LINE)}${' '.repeat(SPACER)}${description}${SPACE.repeat(PADDING)}
${line(OUTTER_LINE)}
${line(PADDING_LINE)}`,
      {
        borderStyle: 'round',
        borderColor: '#2563eb',
        title: chalk.bold('x402scan MCP'),
        //   fullscreen: width => [width, 9],
      }
    )
  );
