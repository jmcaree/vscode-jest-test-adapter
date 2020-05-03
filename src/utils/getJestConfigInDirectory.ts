import { cosmiconfig } from "cosmiconfig";
import { Loaders } from "cosmiconfig/dist/types";

const getJestConfigInDirectory = async (directory: string): Promise<string | null> => {
  const result = await cosmiconfig("jest", { stopDir: directory, loaders: customLoaders }).search(directory);

  if (result === null) {
    return null;
  }
  // TODO in future we may be able to make use of the config object that is returned.
  return result.filepath;
};

const customLoaders: Loaders = {
  // TODO hack.
  // we override the default handling of JS files because there is an issue with resolving modules via cosmiconfig when
  // the app is webpacked (as in this case).  We just return something non-null. 
  ".js": (filepath, content) => ({}),
};

export { getJestConfigInDirectory };
