import { DESCRIBE_ID_SEPARATOR, PROJECT_ID_SEPARATOR, TEST_ID_SEPARATOR } from "../constants";

interface Id {
  projectId: string;
  fileName?: string;
  describeIds?: string[];
  testId?: string;
}

const mapIdToString = (id: Id): string => {
  let result = id.projectId;

  if (id.fileName) {
    result += `${PROJECT_ID_SEPARATOR}${id.fileName}`;

    if (id.describeIds && id.describeIds.length > 0) {
      result += `${DESCRIBE_ID_SEPARATOR}${id.describeIds.join(DESCRIBE_ID_SEPARATOR)}`;
    }

    if (id.testId) {
      result += `${TEST_ID_SEPARATOR}${id.testId}`;
    }
  }

  return result;
};

const mapStringToId = (id: string): Id => {
  const [projectId, fileName, ...rest] = id.split(
    RegExp(`${PROJECT_ID_SEPARATOR}|${TEST_ID_SEPARATOR}|${DESCRIBE_ID_SEPARATOR}`),
  );

  return {
    describeIds: rest.length > 1 ? rest.slice(0, rest.length - 1) : undefined,
    fileName,
    projectId,
    testId: rest[rest.length - 1],
  };
};

export { mapIdToString, mapStringToId };
