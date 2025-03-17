import { Injectable } from "@nestjs/common";
import { QuorizaBaseClickLogService } from "../base/base-click-logs.service";

@Injectable()
export class StlasshClickLogService extends QuorizaBaseClickLogService {
  protected getUsername(): string {
    return process.env.STLASSH_USERNAME ?? "";
  }

  protected getPassword(): string {
    return process.env.STLASSH_PASSWORD ?? "";
  }
}
