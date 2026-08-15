function toNullableNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}


export default function mapInput(row) {

    if (!row) {
        return null;
    }

    return {

        temperature: toNullableNumber(row.temperature),
        humidity: toNullableNumber(row.humidity),

        co2: toNullableNumber(row.co2),

        pm1: toNullableNumber(row.pm1_0),
        pm25: toNullableNumber(row.pm25),
        pm4: toNullableNumber(row.pm4_0),
        pm10: toNullableNumber(row.pm10),

        vocIndex: toNullableNumber(row.vocIndex),
        noxIndex: toNullableNumber(row.noxIndex),

        nc0_5: toNullableNumber(row.nc0_5),
        nc1_0: toNullableNumber(row.nc1_0),
        nc2_5: toNullableNumber(row.nc2_5),
        nc4_0: toNullableNumber(row.nc4_0),
        nc10_0: toNullableNumber(row.nc10_0),

        typicalParticleSize:
            toNullableNumber(row.typicalSize)

    };

}