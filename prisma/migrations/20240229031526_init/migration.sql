-- CreateTable
CREATE TABLE "MinuteDustLevel" (
    "id" SERIAL NOT NULL,
    "pm25Level" DOUBLE PRECISION NOT NULL,
    "co2Level" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Building 5',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MinuteDustLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDustLevel" (
    "id" SERIAL NOT NULL,
    "data" TEXT[],
    "avgpm25Level" DOUBLE PRECISION NOT NULL,
    "avgco2Level" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Building 5',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyDustLevel_pkey" PRIMARY KEY ("id")
);
