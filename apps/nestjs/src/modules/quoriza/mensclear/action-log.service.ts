import { Injectable } from "@nestjs/common";
import { QuorizaBaseActionLogService } from "../base/base-action-log.service";

@Injectable()
export class MensclearActionLogService extends QuorizaBaseActionLogService {
  protected getUsername(): string {
    return process.env.MENSCLEAR_USERNAME ?? "";
  }

  protected getPassword(): string {
    return process.env.MENSCLEAR_PASSWORD ?? "";
  }
}
