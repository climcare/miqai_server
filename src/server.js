/**
 * ======================================================================
 * CORE QAI
 * Server
 * ----------------------------------------------------------------------
 * API Oficial de Integração
 * ======================================================================
 */

import "dotenv/config";
import http from "http";

import mapInput from "./mappers/inputMapper.js";
import SupabaseProvider from "./providers/supabaseProvider.js";

import AnalisarQualidadeAmbiental
    from "../../new_core_qai/src/engine/analysis.js";

import {
    CORPORATE_DOMAIN,
    EDUCATION_DOMAIN,
    HEALTHCARE_DOMAIN,
    RESIDENTIAL_DOMAIN,
    DATACENTER_DOMAIN
} from "../../new_core_qai/src/domains/index.js";

const PORT = process.env.PORT ?? 3000;

const DEBUG =
    process.env.DEBUG === "true";

const provider = new SupabaseProvider();

/**
 * ==========================================================
 * Environment → Domain
 * ==========================================================
 */

const DOMAIN_MAP = Object.freeze({

    OFFICE: CORPORATE_DOMAIN,

    HOTEL: CORPORATE_DOMAIN,

    SCHOOL: EDUCATION_DOMAIN,

    CLINIC: HEALTHCARE_DOMAIN,

    HOSPITAL: HEALTHCARE_DOMAIN,

    CONSULTING_ROOM: HEALTHCARE_DOMAIN,

    RESIDENTIAL: RESIDENTIAL_DOMAIN,

    DATACENTER: DATACENTER_DOMAIN

});

const server = http.createServer(async (req, res) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {

        res.writeHead(204);

        return res.end();

    }

    try {

        // =====================================================
        // DeviceId recebido pela API
        // Ex:
        // http://localhost:3000?deviceId=10
        // =====================================================

        const url =
            new URL(
                req.url,
                `http://${req.headers.host}`
            );

        const deviceId =
            url.searchParams.get("deviceId");

        if (!deviceId) {

            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(
                JSON.stringify(
                    {
                        error: "Parâmetro deviceId é obrigatório."
                    },
                    null,
                    2
                )
            );

        }

        // =====================================================
        // Device Registry
        // =====================================================

        const device =
            await provider.getDevice(deviceId);

        if (!device) {

            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(
                JSON.stringify(
                    {
                        error: "Dispositivo não encontrado."
                    },
                    null,
                    2
                )
            );

        }

        // =====================================================
        // Cadastro
        // =====================================================

        if (!device.environment_type) {

            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(
                JSON.stringify(
                    {
                        error: "Dispositivo sem environment_type cadastrado.",
                        deviceId: device.device_id
                    },
                    null,
                    2
                )
            );

        }

        // =====================================================
        // Última leitura
        // =====================================================

        const reading =
            await provider.getLatestReading(
                device.device_id
            );

        if (!reading) {

            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(
                JSON.stringify(
                    {
                        error: "Nenhuma leitura encontrada."
                    },
                    null,
                    2
                )
            );

        }

        // =====================================================
        // Mapper
        // =====================================================

        const rawReading =
            mapInput(reading);

        if (!rawReading) {

            throw new Error(
                "Falha ao converter telemetria."
            );

        }

        // =====================================================
        // Resolve Domain
        // =====================================================

        const resolvedDomain =
            DOMAIN_MAP[
                device.environment_type
            ];

        if (!resolvedDomain) {

            throw new Error(
                `Environment Type não suportado: ${device.environment_type}`
            );

        }

        // =====================================================
        // Origin
        // =====================================================

        const origin = {
            deviceId: device.device_id,

            deviceName: device.name,

            customerId: device.customer_id,

            environmentType: device.environment_type,

            location: device.location,

            domain: resolvedDomain

        };

        // =====================================================
        // DEBUG
        // =====================================================

        if (DEBUG) {

            console.log("");
            console.log("========== DEVICE ==========");
            console.log(device);
            console.log("============================");

            console.log("");
            console.log("========= READING ==========");
            console.log(reading);
            console.log("============================");

            console.log("");
            console.log("========== ORIGIN ==========");
            console.log({
                deviceId: origin.deviceId,
                customerId: origin.customerId,
                environmentType: origin.environmentType,
                domain: origin.domain.id,
                location: origin.location
            });
            console.log("============================");

        }

        // =====================================================
        // CORE
        // =====================================================

        const resultado =
            AnalisarQualidadeAmbiental(
                rawReading,
                origin
            );

        // =====================================================
        // Resposta
        // =====================================================

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify(
                resultado,
                null,
                2
            )
        );

    }

    catch (err) {

        console.error(err);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify(
                {
                    error: err.message
                },
                null,
                2
            )
        );

    }

});

server.listen(PORT, () => {

    console.log("");
    console.log("==================================");
    console.log(" CORE QAI SERVER ONLINE");
    console.log("==================================");
    console.log(`Port: ${PORT}`);
    console.log(`Debug: ${DEBUG}`);
    console.log("");

});