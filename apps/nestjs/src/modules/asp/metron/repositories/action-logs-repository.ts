import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface MetronRawData {
  承認日時?: string;
  クリック日時?: string;
  注文日時?: string;
  広告ID?: number;
  広告名?: string;
  サイト名?: string;
  OS?: string;
  リファラ?: string;
  報酬額?: string;
  ステータス?: string;
  CL付加情報1	?: string;
  CL付加情報2	?: string;
  CL付加情報3	?: string;
  CL付加情報4	?: string;
  CL付加情報5	?: string;
}

interface MetronFormattedData {
  actionDateTime: Date| null;
  clickDateTime: Date| null;
  adminDateTime: Date | null;
  adId:  number| null;
  adName: string | null;
  siteName: string | null;
  actionOs: string | null;
  actionReferrer: string | null;
  amount: string | null;
  status: string | null;
  clInformation1: string | null;
  clInformation2: string | null;
  clInformation3: string | null;
  clInformation4: string | null;
  clInformation5: string | null;
}




@Injectable()
export class MetronActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}
  private formatData(item: MetronRawData): MetronFormattedData {

    return {
      actionDateTime: toValidDate(item["注文日時"]),
      clickDateTime: toValidDate(item["クリック日時"]),
      adminDateTime: toValidDate(item["承認日時"]),
      adId: Number(item["広告ID"]) || null,
      adName: item["広告名"] || null,
      siteName: item["サイト名"] || null,
      actionOs: item["OS"] || null,
      actionReferrer: item["リファラ"] || null,
      amount: item["報酬額"] || null,
      status: item["ステータス"] || null,
      clInformation1: item["CL付加情報1"] || null,
      clInformation2: item["CL付加情報2"] || null,
      clInformation3: item["CL付加情報3"] || null,
      clInformation4: item["CL付加情報4"] || null,
      clInformation5: item["CL付加情報5"] || null,
    };
  }

  async save(conversionData: MetronRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.metronActionLog.create({
        data: formattedData,
      });
    }
  }
  
}
function toValidDate(value?: string): Date | null {
  if (!value || value === "0000-00-00 00:00:00") return null;
  const isoLike = value.replace(" ", "T");
  const date = new Date(isoLike);
  return isNaN(date.getTime()) ? null : date;
}

