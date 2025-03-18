import { Injectable } from "@nestjs/common";
import { QuorizaBaseActionLogService } from "../base/base-action-logs.service";

@Injectable()
export class MensclearActionLogService extends QuorizaBaseActionLogService {
  protected getUsername(): string {
    return process.env.MENSCLEAR_USERNAME ?? "";
  }

  protected getPassword(): string {
    return process.env.MENSCLEAR_PASSWORD ?? "";
  }
}
