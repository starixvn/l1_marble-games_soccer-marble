const config1 = {
  scoreRate: {
    "1-0": 0.55,
    "0-1": 0.45,
  },
};

const config2 = {
  scoreRate: {
    "1-0": 0.45,
    "0-1": 0.55,
  },
};

const config3 = {
  scoreRate: {
    "1-0": 0.25,
    "0-1": 0.25,
    "0-0": 0.5,
  },
};

const config4 = {
  scoreRate: {
    "1-0": 0.25,
    "0-1": 0.25,
    "0-0": 0.5,
  },
};

export const rateConfigs = {
  homeFavorite: [config1],
  homeFavoriteDraw: [config3],
  awayFavorite: [config2],
  awayFavoriteDraw: [config4],
};
