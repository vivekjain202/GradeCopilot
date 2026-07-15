export class AuthorizationError extends Error {
  constructor() {
    super("You do not have permission to access this resource.");
  }
}

export type TeacherOwned = {
  teacherId: string;
};

export function assertTeacherOwnership<T extends TeacherOwned>(
  resource: T,
  teacherId: string,
) {
  if (resource.teacherId !== teacherId) {
    throw new AuthorizationError();
  }

  return resource;
}
