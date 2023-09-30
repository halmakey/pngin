import { CustomError } from "ts-custom-error";

export class HttpStatusError extends CustomError {
  constructor(public status: number, message: string) {
    super("Http status code: " + status + " : " + message);
  }
}
