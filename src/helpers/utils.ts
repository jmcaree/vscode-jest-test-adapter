import { cosmiconfig } from "cosmiconfig";
import { inspect } from "util";

const convertErrorToString = (error: Error): string => {
  return inspect(error, false, 2, true);
};

const getJestConfigInDirectory = async (directory: string): Promise<string | null> => {
  const result= await cosmiconfig("jest", {stopDir: directory}).search(directory);
  if (result === null) {
    return null;
  }
  // TODO in future we may be able to make use of the config object that is returned.
  return result.filepath;
}

export { convertErrorToString, getJestConfigInDirectory };
