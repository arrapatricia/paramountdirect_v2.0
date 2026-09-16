-- CreateTable
CREATE TABLE "PdLifePolicyNumberSequence" (
    "planCode" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PdLifePolicyNumberSequence_pkey" PRIMARY KEY ("planCode")
);

