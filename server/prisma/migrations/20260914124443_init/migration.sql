-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "BranchDivision" AS ENUM ('LIFE', 'NON_LIFE');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "PdLifePlanCategory" AS ENUM ('Health', 'LifeAccident', 'Comprehensive');

-- CreateEnum
CREATE TYPE "PdLifeStatus" AS ENUM ('Received', 'For_Verification', 'For_Evaluation', 'Paid', 'Issued');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('Single', 'Married', 'Widower', 'Separated');

-- CreateEnum
CREATE TYPE "SalaryCurrency" AS ENUM ('PHP', 'USD', 'HKD', 'Others');

-- CreateEnum
CREATE TYPE "NatureOfEmployment" AS ENUM ('Direct_hired', 'Balik_Manggagawa');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('Land_based', 'Sea_based');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('Uploaded', 'Missing');

-- CreateEnum
CREATE TYPE "OfwStatus" AS ENUM ('Received', 'Cancelled', 'Duplicate', 'Reversed');

-- CreateEnum
CREATE TYPE "CtplPolicyType" AS ENUM ('Private_Car', 'Commercial_Vehicle', 'Motorcycle');

-- CreateEnum
CREATE TYPE "CtplRenewalType" AS ENUM ('New_1_Year', 'Renewal');

-- CreateEnum
CREATE TYPE "CtplClientType" AS ENUM ('Individual', 'Corporate_without_assignee', 'Corporate_with_assignee');

-- CreateEnum
CREATE TYPE "CtplStatus" AS ENUM ('Completed', 'Spoiled', 'Duplicate', 'Reversed', 'Cancelled');

-- CreateEnum
CREATE TYPE "GtpTravelType" AS ENUM ('International', 'Domestic');

-- CreateEnum
CREATE TYPE "GtpApplicationType" AS ENUM ('Individual', 'Family');

-- CreateEnum
CREATE TYPE "GtpPlanVariant" AS ENUM ('Single_Trip', 'Multi_Trip_90', 'Multi_Trip_180');

-- CreateEnum
CREATE TYPE "GtpStatus" AS ENUM ('Received', 'Cancelled', 'Duplicate');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('Inforced', 'Lapsed', 'Terminated', 'Matured', 'Involuntary', 'Voluntary', 'Surrender');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "assignedProducts" TEXT[],
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT,
    "branchId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productScope" TEXT NOT NULL,
    "isDirectMarketing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "division" "BranchDivision" NOT NULL,
    "region" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "barangay" TEXT,
    "zipcode" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT NOT NULL,
    "status" "BranchStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdLifeApplication" (
    "id" TEXT NOT NULL,
    "payor" TEXT NOT NULL,
    "planCategory" "PdLifePlanCategory" NOT NULL,
    "planCode" TEXT NOT NULL,
    "planDesc" TEXT NOT NULL,
    "premium" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "dateScreened" TIMESTAMP(3),
    "screenedBy" TEXT,
    "status" "PdLifeStatus" NOT NULL DEFAULT 'Received',
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdLifeApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfwApplication" (
    "id" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "civilStatus" "CivilStatus" NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "phAddress" TEXT NOT NULL,
    "phCity" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referralSource" TEXT NOT NULL,
    "natureOfEmployment" "NatureOfEmployment" NOT NULL,
    "coverageType" "CoverageType" NOT NULL,
    "occupation" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "salaryAmount" DOUBLE PRECISION NOT NULL,
    "salaryCurrency" "SalaryCurrency" NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerCountry" TEXT NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3) NOT NULL,
    "insuranceStart" TIMESTAMP(3) NOT NULL,
    "isConflictZone" BOOLEAN NOT NULL DEFAULT false,
    "passportDoc" "DocumentStatus" NOT NULL DEFAULT 'Missing',
    "visaDoc" "DocumentStatus" NOT NULL DEFAULT 'Missing',
    "employmentContractDoc" "DocumentStatus" NOT NULL DEFAULT 'Missing',
    "medicalCertificateDoc" "DocumentStatus" NOT NULL DEFAULT 'Missing',
    "premium" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "status" "OfwStatus" NOT NULL DEFAULT 'Received',
    "screenedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfwApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CtplApplication" (
    "id" TEXT NOT NULL,
    "policyType" "CtplPolicyType" NOT NULL,
    "mvType" TEXT NOT NULL,
    "renewalType" "CtplRenewalType" NOT NULL,
    "clientType" "CtplClientType" NOT NULL,
    "ownerFirstName" TEXT NOT NULL,
    "ownerMiddleName" TEXT NOT NULL,
    "ownerSurname" TEXT NOT NULL,
    "sameAsOwner" BOOLEAN NOT NULL DEFAULT true,
    "applicantFirstName" TEXT NOT NULL,
    "applicantSurname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "mvFileNumber" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "requiresCOV" BOOLEAN NOT NULL DEFAULT false,
    "premium" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "status" "CtplStatus" NOT NULL DEFAULT 'Completed',
    "screenedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CtplApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GtpApplication" (
    "id" TEXT NOT NULL,
    "travelType" "GtpTravelType" NOT NULL,
    "destinations" TEXT[],
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "daysOfTravel" INTEGER NOT NULL,
    "applicationType" "GtpApplicationType" NOT NULL,
    "travelerFirstName" TEXT NOT NULL,
    "travelerSurname" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "planVariant" "GtpPlanVariant" NOT NULL,
    "cruiseCoverage" BOOLEAN NOT NULL DEFAULT false,
    "hazardousSportsCoverage" BOOLEAN NOT NULL DEFAULT false,
    "isSchengenDestination" BOOLEAN NOT NULL DEFAULT false,
    "premium" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "status" "GtpStatus" NOT NULL DEFAULT 'Received',
    "screenedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GtpApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "policyNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "currentAge" INTEGER NOT NULL,
    "issueAge" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "telephoneNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "policyStatus" "PolicyStatus" NOT NULL,
    "hcrStatus" TEXT NOT NULL,
    "hcrUnit" TEXT NOT NULL,
    "premium" DOUBLE PRECISION NOT NULL,
    "hcrPremium" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL,
    "underpay" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "payType" TEXT NOT NULL,
    "cashValue" DOUBLE PRECISION NOT NULL,
    "lifeBenefits" DOUBLE PRECISION NOT NULL,
    "accidentalBenefits" DOUBLE PRECISION NOT NULL,
    "mode" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "effectivityDate" TIMESTAMP(3) NOT NULL,
    "policyDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "planCode" TEXT NOT NULL,
    "planDesc" TEXT NOT NULL,
    "orDate" TIMESTAMP(3),
    "orNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLedgerItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "yrInstal" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "uploaded" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "underpay" DOUBLE PRECISION NOT NULL,
    "orNumber" TEXT NOT NULL,
    "orDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "PaymentLedgerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userLabel" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_productScope_key" ON "Role"("name", "productScope");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_moduleName_key" ON "RolePermission"("roleId", "moduleName");

-- CreateIndex
CREATE INDEX "PdLifeApplication_status_idx" ON "PdLifeApplication"("status");

-- CreateIndex
CREATE INDEX "PdLifeApplication_planCategory_idx" ON "PdLifeApplication"("planCategory");

-- CreateIndex
CREATE INDEX "OfwApplication_status_idx" ON "OfwApplication"("status");

-- CreateIndex
CREATE INDEX "CtplApplication_status_idx" ON "CtplApplication"("status");

-- CreateIndex
CREATE INDEX "GtpApplication_status_idx" ON "GtpApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_policyNo_key" ON "PaymentTransaction"("policyNo");

-- CreateIndex
CREATE INDEX "PaymentLedgerItem_paymentId_idx" ON "PaymentLedgerItem"("paymentId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLedgerItem" ADD CONSTRAINT "PaymentLedgerItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
