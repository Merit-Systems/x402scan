// prettier-ignore

import boxen from 'boxen';
import chalk from 'chalk';

interface BannerProps {
  heading: string;
  description: string;
}

const HEX = '#2563eb';
const SPACER = 6;
const PADDING = 3;

const CHARACTER = '#';
const SPACE = ' ';

const OUTTER_LINE = `  ${CHARACTER.repeat(7)}`;
const INNER_LINE = `${CHARACTER.repeat(2)}${SPACE.repeat(2)}${CHARACTER.repeat(3)}`;
const MIDDLE_LINE = `${CHARACTER.repeat(3)}`;

const line = (text: string) => `${chalk.bold.hex(HEX)(text)}`;

export const banner = ({ heading, description }: BannerProps) =>
  boxen(
    `${line(OUTTER_LINE)}
${line(INNER_LINE)}${' '.repeat(SPACER)}${chalk.bold(heading)}${SPACE.repeat(PADDING)}
${line(MIDDLE_LINE)}
${line(INNER_LINE)}${' '.repeat(SPACER)}${description}${SPACE.repeat(PADDING)}
${line(OUTTER_LINE)}`,
    {
      borderStyle: 'round',
      borderColor: '#2563eb',
      title: chalk.bold('x402scan MCP'),
      padding: 1,
      //   fullscreen: width => [width, 9],
    }
  );

export const printBanner = ({ heading, description }: BannerProps) =>
  console.log(banner({ heading, description }));
