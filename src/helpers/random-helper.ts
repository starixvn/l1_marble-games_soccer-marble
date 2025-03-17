import Chance from "chance";
import { MersenneTwister19937, Random } from "random-js";
import { createHash, getRandomValues, randomInt } from "crypto";

const chance = new Chance();
const random = new Random(MersenneTwister19937.autoSeed());

const random1 = (arrLength: number) => randomInt(0, arrLength);

const random2 = (arrLength: number) => {
    const array = new Uint32Array(1);
    const randomArr = getRandomValues(array);
    return randomArr[0] % arrLength;
};

const random3 = (arrLength: number) => {
    const timestamp = Date.now();
    const randomValue = randomInt(0, arrLength);
    return (randomValue + timestamp) % arrLength;
};

const random4 = (arrLength: number) => random.integer(0, arrLength - 1);

const random5 = (arrLength: number) => chance.integer({ min: 0, max: arrLength - 1 });

const random6 = (arrLength: number) => {
    const randomValue = randomInt(0, arrLength).toString();
    const hash = createHash("sha256").update(randomValue).digest("hex");
    return parseInt(hash.substring(0, 8), 16) % arrLength;
};

export const randomModes: any = {
    1: [random1, random2, random3, random4],
    2: [random1, random3, random5, random6],
    3: [random2, random3, random4, random6],
};

export const getRandomIndexFromArray = (randomMode: number, arrLength: number): number => {
    const mode = 1 <= randomMode && randomMode <= 3 ? randomMode : 1;
    const randomShuffles: Function[] = randomModes[mode];
    return chance.pickone(randomShuffles)(arrLength);
};
