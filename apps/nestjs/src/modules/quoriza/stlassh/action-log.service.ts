import { Injectable } from "@nestjs/common";
import { QuorizaBaseActionLogService } from "../base/base-action-log.service";

@Injectable()
export class StlasshActionLogService extends  QuorizaBaseActionLogService {
  protected getUsername(): string {
    return process.env.STLASSH_USERNAME ?? "";
  }

  protected getPassword(): string {
    return process.env.STLASSH_PASSWORD ?? "";
  }
}
