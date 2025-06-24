import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { IsArray, IsString } from "class-validator";
import { AspCollectionService } from "./asp-collection.service";

class CollectAspDataDto {
  @IsArray()
  @IsString({ each: true })
  asps: string[];
}

interface CollectAspDataResponse {
  success: boolean;
  message: string;
  results?: {
    succeeded: number;
    failed: number;
    total: number;
    totalRecords: number;
    duration: number;
    details: Array<{
      name: string;
      success: boolean;
      count?: number;
      error?: string;
    }>;
  };
  error?: string;
}

@Controller("asp")
export class AspController {
  constructor(private readonly aspCollectionService: AspCollectionService) {}

  @Post("/collect-data")
  @HttpCode(HttpStatus.OK)
  async collectAspData(
    @Body() body: CollectAspDataDto,
  ): Promise<CollectAspDataResponse> {
    try {
      const aspsToCollect = body.asps;

      const results =
        await this.aspCollectionService.collectSpecificAspData(aspsToCollect);

      return {
        success: true,
        message: "ASPデータ収集が正常に完了しました",
        results,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      throw new HttpException(
        {
          success: false,
          message: "ASPデータ収集中にエラーが発生しました",
          error: errorMsg,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
