import { inspect } from "util";

const convertErrorToString = (error: Error, color = false): string => {
  return inspect(error, false, 2, color);
};

export { convertErrorToString };
