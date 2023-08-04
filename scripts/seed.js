import { readFileSync, existsSync, rm } from 'fs';
import { join, resolve } from 'path';
import { unrar } from 'unrar-promise';
import { config } from 'dotenv';
import mongoose, { connect } from 'mongoose';

import { getDbUrl } from '../db/db.js'
import Desp from '../models/Desp.js';
import Quality from '../models/Quality.js';

config();

function extractSeedFile() {
    return new Promise((success, reject) => {
        const tarFileName = join(process.cwd(), 'DB JSON.rar');
        const tarFilePath = resolve(tarFileName);

        const outputPathName = join(process.cwd(), 'tmp');
        const outputPath = resolve(outputPathName);

        const doesSeedDataExist = existsSync(tarFilePath);

        if (doesSeedDataExist) {
            const tarFile = readFileSync(tarFilePath);
            unrar(tarFile, outputPath, { password: process.env.UNRAR_PASSWORD })
                .then((data) => {
                    console.log(`File Extracted: ${data}`);
                    success();
                });
        } else {
            reject({ message: 'Seed Data does not exist' });
        }
    });
}

function prepareData() {
    return new Promise((success, reject) => {
        const despFileName = join(process.cwd(), 'tmp', 'DB JSON', 'estimator.desp.json');
        const despFilePath = resolve(despFileName);
        const despDataRaw = readFileSync(despFilePath, { encoding: 'utf-8' })

        const qualityFileName = join(process.cwd(), 'tmp', 'DB JSON', 'estimator.quality.json');
        const qualityFilePath = resolve(qualityFileName);
        const qualityDataRaw = readFileSync(qualityFilePath, { encoding: 'utf-8' });

        try {
            const despData = JSON.parse(despDataRaw);
            const qualityData = JSON.parse(qualityDataRaw);

            const desp = despData.map(({ _id, ...rest }) => rest);
            const quality = qualityData.map(({ _id, ...rest }) => rest);

            success({ desp, quality });
        } catch (e) {
            reject({ message: e });
        }

    })
}

function populateData({ desp, quality }) {

    const dbUri = getDbUrl();

    return new Promise((resolve, reject) => {
        connect(dbUri)
            .then(() => {
                Desp.insertMany(desp)
                    .then(() => {
                        Quality.insertMany(quality)
                            .then(resolve)
                            .catch((error) => {
                                reject({ message: 'Failed to insert Qualities', error });
                            });
                    })
                    .catch((error) => {
                        reject({ message: 'Failed to insert Desp', error });
                    });
            })
            .catch((error) => reject({ message: 'Unable to Connect to the Database', error }));
    })
}

function cleanup() {
    const tmpFolderName = join(process.cwd(), 'tmp');
    const tmpFolderPath = resolve(tmpFolderName);
    const deletionOptions = { recursive: true, force: true };

    return new Promise((success, reject) => {
        rm(tmpFolderPath, deletionOptions, (error) => {
            if (error) {
                reject({ message: 'Unable to remove the tmp folder', error });
            } else {
                success();
            }
        })
    });
}

function closeDbConnection() {
    return mongoose.connection.close();
}



const seedDatabase = () => {
    extractSeedFile()
        .then(prepareData)
        .then(populateData)
        .then(cleanup)
        .then(closeDbConnection)
        .then(() => console.log('Success'))
        .catch(console.error);
}

seedDatabase();