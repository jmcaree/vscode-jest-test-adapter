import { inspect } from "util";

const convertErrorToString = (error: Error): string => {
  return inspect(error, false, 2, true);
};

export { convertErrorToString };
