/*
  Warnings:

  - You are about to drop the column `actionInfo1` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adgroupName` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `advertiserName` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `carrier` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `catsReportId` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData1` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `conversionPointName` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory1` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory2` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaName` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `midClData1` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `midClickCount` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `midClickDate` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerClickUrl` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `salesAmount` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `trackingUserId` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `useRotation` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgentAction` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgentClick` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userIpAction` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userIpClick` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adgroupName` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `advertiserName` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `carrier` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `catsReportId` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData1` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `facebookClId` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory1` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory2` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaName` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `redirectAdUrlName` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrer` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `tiktokClId` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `trackingUserId` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `useRotation` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `adId` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalDate` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData1` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData2` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData3` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData4` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData5` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `urlName` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `urlNumber` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `acquisitionCount` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionCvr` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `adId` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalCount` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalCvr` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickCost` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickRewardAmount` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedCount` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteUrl` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `totalRewardAmount` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionId` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adCategory` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalDateTime` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `campaignName` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDateTime` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceType` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `lpUrl` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerUrl` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `trackingParams` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionData` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalRate` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvedCount` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `cvr` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionsCount` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `unapprovedCount` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionRewardAmount` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `projectName` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `cvData` on the `MonkeyClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `cvrData` on the `MonkeyClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `MonkeyClickLog` table. All the data in the column will be lost.
  - The `clickData` column on the `MonkeyClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `actionDeadline` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adSiteId` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adSiteName` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `advertiserName` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalDateTime` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDateTime` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceType` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `reasonRefusal` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerUrl` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `salesAmount` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `salesNumber` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adCategory` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvedNnumber` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvedRewardAmount` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `campaignName` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceType` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `landingPageName` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `lpUrl` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `ocRate` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerUrl` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `selesNumber` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `trackingParams` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionAmount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionDetails` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionId` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adMaterial` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvalStatus` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedDate` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerUrl` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionAmount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionCount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedActionAmount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedActionCount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `ctr` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `cvr` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `impCount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `adAuthority` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `campaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `courseName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `courseNameDetail` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `creativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `cvName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceType` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `eighthUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fifthUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `firstUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `fourthUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ninthUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `secondUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `seventhUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sixthUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tenthUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdAdGroupName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdAdIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdAdTitle` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdAdUrl` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdCampaignName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdClicked` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdClickedIdentifier` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdCreativeName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdCreativeUtmName` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `thirdUtmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `utmSource` on the `WebantennaActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionInfo1` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adgroupName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `advertiserName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `carrier` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `catsReportId` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData1` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `conversionPointName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `lineName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `lineUserId` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `lineUserName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory1` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory2` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `midClData1` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `midClickCount` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `midClickDate` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `salesAmount` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `trackingUserId` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `useRotation` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgentAction` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgentClick` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userIpAction` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `userIpClick` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adgroupName` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `advertiserName` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `carrier` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `catsReportId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clData1` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `facebookClId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `googleClId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `googleGbrald` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `googleWbrald` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `ipAdress` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory1` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaCategory2` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaName` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `osType` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `redirectAdUrlName` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `tiktokClId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `trackingUserId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `useRotation` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `xClId` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `yafooSearchAdClId` on the `ladClickLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CatsActionLog" DROP COLUMN "actionInfo1",
DROP COLUMN "adName",
DROP COLUMN "adgroupName",
DROP COLUMN "advertiserName",
DROP COLUMN "carrier",
DROP COLUMN "catsReportId",
DROP COLUMN "clData1",
DROP COLUMN "clickDate",
DROP COLUMN "conversionPointName",
DROP COLUMN "mediaCategory1",
DROP COLUMN "mediaCategory2",
DROP COLUMN "mediaName",
DROP COLUMN "midClData1",
DROP COLUMN "midClickCount",
DROP COLUMN "midClickDate",
DROP COLUMN "osType",
DROP COLUMN "referrerClickUrl",
DROP COLUMN "rewardAmount",
DROP COLUMN "salesAmount",
DROP COLUMN "sessionId",
DROP COLUMN "trackingUserId",
DROP COLUMN "useRotation",
DROP COLUMN "userAgentAction",
DROP COLUMN "userAgentClick",
DROP COLUMN "userId",
DROP COLUMN "userIpAction",
DROP COLUMN "userIpClick";

-- AlterTable
ALTER TABLE "CatsClickLog" DROP COLUMN "adgroupName",
DROP COLUMN "advertiserName",
DROP COLUMN "carrier",
DROP COLUMN "catsReportId",
DROP COLUMN "clData1",
DROP COLUMN "facebookClId",
DROP COLUMN "ipAddress",
DROP COLUMN "mediaCategory1",
DROP COLUMN "mediaCategory2",
DROP COLUMN "mediaName",
DROP COLUMN "osType",
DROP COLUMN "redirectAdUrlName",
DROP COLUMN "referrer",
DROP COLUMN "sessionId",
DROP COLUMN "status",
DROP COLUMN "tiktokClId",
DROP COLUMN "trackingUserId",
DROP COLUMN "useRotation",
DROP COLUMN "userAgent",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "FinebirdActionLog" DROP COLUMN "adId",
DROP COLUMN "adName",
DROP COLUMN "approvalDate",
DROP COLUMN "clData1",
DROP COLUMN "clData2",
DROP COLUMN "clData3",
DROP COLUMN "clData4",
DROP COLUMN "clData5",
DROP COLUMN "clickDate",
DROP COLUMN "osType",
DROP COLUMN "rewardAmount",
DROP COLUMN "status",
DROP COLUMN "urlName",
DROP COLUMN "urlNumber";

-- AlterTable
ALTER TABLE "FinebirdClickLog" DROP COLUMN "acquisitionCount",
DROP COLUMN "actionCvr",
DROP COLUMN "adId",
DROP COLUMN "adName",
DROP COLUMN "approvalCount",
DROP COLUMN "approvalCvr",
DROP COLUMN "clickCost",
DROP COLUMN "clickRewardAmount",
DROP COLUMN "rejectedCount",
DROP COLUMN "rewardAmount",
DROP COLUMN "siteUrl",
DROP COLUMN "totalRewardAmount";

-- AlterTable
ALTER TABLE "HanikamuActionLog" DROP COLUMN "actionId",
DROP COLUMN "adCategory",
DROP COLUMN "adName",
DROP COLUMN "approvalDateTime",
DROP COLUMN "campaignName",
DROP COLUMN "clickDateTime",
DROP COLUMN "deviceType",
DROP COLUMN "lpUrl",
DROP COLUMN "osType",
DROP COLUMN "referrerUrl",
DROP COLUMN "status",
DROP COLUMN "trackingParams";

-- AlterTable
ALTER TABLE "HanikamuClickLog" DROP COLUMN "actionData",
DROP COLUMN "approvalRate",
DROP COLUMN "approvedCount",
DROP COLUMN "cvr",
DROP COLUMN "linkUrl",
DROP COLUMN "rejectionsCount",
DROP COLUMN "unapprovedCount";

-- AlterTable
ALTER TABLE "MonkeyActionLog" DROP COLUMN "actionRewardAmount",
DROP COLUMN "clickDate",
DROP COLUMN "deviceInfo",
DROP COLUMN "orderId",
DROP COLUMN "projectName";

-- AlterTable
ALTER TABLE "MonkeyClickLog" DROP COLUMN "cvData",
DROP COLUMN "cvrData",
DROP COLUMN "rewardAmount",
DROP COLUMN "clickData",
ADD COLUMN     "clickData" INTEGER;

-- AlterTable
ALTER TABLE "RentracksActionLog" DROP COLUMN "actionDeadline",
DROP COLUMN "adSiteId",
DROP COLUMN "adSiteName",
DROP COLUMN "advertiserName",
DROP COLUMN "approvalDateTime",
DROP COLUMN "clickDateTime",
DROP COLUMN "deviceInfo",
DROP COLUMN "deviceType",
DROP COLUMN "productName",
DROP COLUMN "reasonRefusal",
DROP COLUMN "referrerUrl",
DROP COLUMN "rewardAmount",
DROP COLUMN "salesAmount",
DROP COLUMN "salesNumber",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "RentracksClickLog" DROP COLUMN "adCategory",
DROP COLUMN "adName",
DROP COLUMN "approvedNnumber",
DROP COLUMN "approvedRewardAmount",
DROP COLUMN "campaignName",
DROP COLUMN "deviceType",
DROP COLUMN "landingPageName",
DROP COLUMN "lpUrl",
DROP COLUMN "ocRate",
DROP COLUMN "osType",
DROP COLUMN "referrerUrl",
DROP COLUMN "selesNumber",
DROP COLUMN "status",
DROP COLUMN "trackingParams";

-- AlterTable
ALTER TABLE "SampleAffiliateActionLog" DROP COLUMN "actionAmount",
DROP COLUMN "actionDetails",
DROP COLUMN "actionId",
DROP COLUMN "adMaterial",
DROP COLUMN "adName",
DROP COLUMN "approvalStatus",
DROP COLUMN "clickDate",
DROP COLUMN "confirmedDate",
DROP COLUMN "referrerUrl";

-- AlterTable
ALTER TABLE "SampleAffiliateClickLog" DROP COLUMN "actionAmount",
DROP COLUMN "actionCount",
DROP COLUMN "confirmedActionAmount",
DROP COLUMN "confirmedActionCount",
DROP COLUMN "ctr",
DROP COLUMN "cvr",
DROP COLUMN "impCount",
DROP COLUMN "rewardAmount";

-- AlterTable
ALTER TABLE "WebantennaActionLog" DROP COLUMN "adAuthority",
DROP COLUMN "adGroupName",
DROP COLUMN "adIdentifier",
DROP COLUMN "adTitle",
DROP COLUMN "adUrl",
DROP COLUMN "campaignName",
DROP COLUMN "clicked",
DROP COLUMN "courseName",
DROP COLUMN "courseNameDetail",
DROP COLUMN "creativeUtmName",
DROP COLUMN "cvName",
DROP COLUMN "deviceType",
DROP COLUMN "eighthAdGroupName",
DROP COLUMN "eighthAdIdentifier",
DROP COLUMN "eighthAdTitle",
DROP COLUMN "eighthAdUrl",
DROP COLUMN "eighthCampaignName",
DROP COLUMN "eighthClicked",
DROP COLUMN "eighthClickedIdentifier",
DROP COLUMN "eighthCreativeName",
DROP COLUMN "eighthCreativeUtmName",
DROP COLUMN "eighthUtmSource",
DROP COLUMN "fifthAdGroupName",
DROP COLUMN "fifthAdIdentifier",
DROP COLUMN "fifthAdTitle",
DROP COLUMN "fifthAdUrl",
DROP COLUMN "fifthCampaignName",
DROP COLUMN "fifthClicked",
DROP COLUMN "fifthClickedIdentifier",
DROP COLUMN "fifthCreativeName",
DROP COLUMN "fifthCreativeUtmName",
DROP COLUMN "fifthUtmSource",
DROP COLUMN "firstAdGroupName",
DROP COLUMN "firstAdIdentifier",
DROP COLUMN "firstAdTitle",
DROP COLUMN "firstAdUrl",
DROP COLUMN "firstCampaignName",
DROP COLUMN "firstClicked",
DROP COLUMN "firstClickedIdentifier",
DROP COLUMN "firstCreativeName",
DROP COLUMN "firstCreativeUtmName",
DROP COLUMN "firstUtmSource",
DROP COLUMN "fourthAdGroupName",
DROP COLUMN "fourthAdIdentifier",
DROP COLUMN "fourthAdTitle",
DROP COLUMN "fourthAdUrl",
DROP COLUMN "fourthCampaignName",
DROP COLUMN "fourthClicked",
DROP COLUMN "fourthClickedIdentifier",
DROP COLUMN "fourthCreativeName",
DROP COLUMN "fourthCreativeUtmName",
DROP COLUMN "fourthUtmSource",
DROP COLUMN "ninthAdGroupName",
DROP COLUMN "ninthAdIdentifier",
DROP COLUMN "ninthAdTitle",
DROP COLUMN "ninthAdUrl",
DROP COLUMN "ninthCampaignName",
DROP COLUMN "ninthClicked",
DROP COLUMN "ninthClickedIdentifier",
DROP COLUMN "ninthCreativeName",
DROP COLUMN "ninthCreativeUtmName",
DROP COLUMN "ninthUtmSource",
DROP COLUMN "secondAdGroupName",
DROP COLUMN "secondAdIdentifier",
DROP COLUMN "secondAdTitle",
DROP COLUMN "secondAdUrl",
DROP COLUMN "secondCampaignName",
DROP COLUMN "secondClicked",
DROP COLUMN "secondClickedIdentifier",
DROP COLUMN "secondCreativeName",
DROP COLUMN "secondCreativeUtmName",
DROP COLUMN "secondUtmSource",
DROP COLUMN "sessionId",
DROP COLUMN "seventhAdGroupName",
DROP COLUMN "seventhAdIdentifier",
DROP COLUMN "seventhAdTitle",
DROP COLUMN "seventhAdUrl",
DROP COLUMN "seventhCampaignName",
DROP COLUMN "seventhClicked",
DROP COLUMN "seventhClickedIdentifier",
DROP COLUMN "seventhCreativeName",
DROP COLUMN "seventhCreativeUtmName",
DROP COLUMN "seventhUtmSource",
DROP COLUMN "sixthAdGroupName",
DROP COLUMN "sixthAdIdentifier",
DROP COLUMN "sixthAdTitle",
DROP COLUMN "sixthAdUrl",
DROP COLUMN "sixthCampaignName",
DROP COLUMN "sixthClicked",
DROP COLUMN "sixthClickedIdentifier",
DROP COLUMN "sixthCreativeName",
DROP COLUMN "sixthCreativeUtmName",
DROP COLUMN "sixthUtmSource",
DROP COLUMN "tenthAdGroupName",
DROP COLUMN "tenthAdIdentifier",
DROP COLUMN "tenthAdTitle",
DROP COLUMN "tenthAdUrl",
DROP COLUMN "tenthCampaignName",
DROP COLUMN "tenthClicked",
DROP COLUMN "tenthClickedIdentifier",
DROP COLUMN "tenthCreativeName",
DROP COLUMN "tenthCreativeUtmName",
DROP COLUMN "tenthUtmSource",
DROP COLUMN "thirdAdGroupName",
DROP COLUMN "thirdAdIdentifier",
DROP COLUMN "thirdAdTitle",
DROP COLUMN "thirdAdUrl",
DROP COLUMN "thirdCampaignName",
DROP COLUMN "thirdClicked",
DROP COLUMN "thirdClickedIdentifier",
DROP COLUMN "thirdCreativeName",
DROP COLUMN "thirdCreativeUtmName",
DROP COLUMN "thirdUtmSource",
DROP COLUMN "userId",
DROP COLUMN "utmSource";

-- AlterTable
ALTER TABLE "ladActionLog" DROP COLUMN "actionInfo1",
DROP COLUMN "adName",
DROP COLUMN "adgroupName",
DROP COLUMN "advertiserName",
DROP COLUMN "carrier",
DROP COLUMN "catsReportId",
DROP COLUMN "clData1",
DROP COLUMN "clickDate",
DROP COLUMN "conversionPointName",
DROP COLUMN "lineName",
DROP COLUMN "lineUserId",
DROP COLUMN "lineUserName",
DROP COLUMN "mediaCategory1",
DROP COLUMN "mediaCategory2",
DROP COLUMN "mediaName",
DROP COLUMN "midClData1",
DROP COLUMN "midClickCount",
DROP COLUMN "midClickDate",
DROP COLUMN "osType",
DROP COLUMN "rewardAmount",
DROP COLUMN "salesAmount",
DROP COLUMN "sessionId",
DROP COLUMN "trackingUserId",
DROP COLUMN "useRotation",
DROP COLUMN "userAgentAction",
DROP COLUMN "userAgentClick",
DROP COLUMN "userId",
DROP COLUMN "userIpAction",
DROP COLUMN "userIpClick";

-- AlterTable
ALTER TABLE "ladClickLog" DROP COLUMN "adgroupName",
DROP COLUMN "advertiserName",
DROP COLUMN "carrier",
DROP COLUMN "catsReportId",
DROP COLUMN "clData1",
DROP COLUMN "facebookClId",
DROP COLUMN "googleClId",
DROP COLUMN "googleGbrald",
DROP COLUMN "googleWbrald",
DROP COLUMN "ipAdress",
DROP COLUMN "mediaCategory1",
DROP COLUMN "mediaCategory2",
DROP COLUMN "mediaName",
DROP COLUMN "osType",
DROP COLUMN "redirectAdUrlName",
DROP COLUMN "sessionId",
DROP COLUMN "status",
DROP COLUMN "tiktokClId",
DROP COLUMN "trackingUserId",
DROP COLUMN "useRotation",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
DROP COLUMN "xClId",
DROP COLUMN "yafooSearchAdClId";
