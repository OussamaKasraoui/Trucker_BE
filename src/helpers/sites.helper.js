'use strict';

const Site                  = require('../models/sites.model');
const Contract              = require('../models/contracts.model');


exports.create = async function (sites) {
    let returnSites = {
        error: false,
        payload: null,
        code: 201
    };

    // Check if 'sites' data is provided
    if (!sites || !Array.isArray(sites)) {
        returnSites.error = true;
        returnSites.payload = "noSiteDataProvided";  // Consistent payload for missing data
        returnSites.code = Array.isArray(sites) ? 400 : 500;  // Bad request
        return returnSites;  // Early return on error
    }

    const results = [];

    // Loop over each site in the array and attempt to insert it
    for (const [index, site] of sites.entries()) {
        if (site.id == ''){

            try {
                // Create each site document individually
                const docSite = await Site.create(site);

                results.push({ code: 201, error: false, data: await docSite.populateAndTransform() });

            } catch (error) {
                console.error("Error creating site:", error);

                const errorDetails = {
                    code: 400,
                    error: true,
                };

                // Handle validation errors specifically
                if (error?.errors && Object.keys(error.errors).length) {

                    const validationErrors = {};
                    for (const key in error.errors) {

                        if (error.errors.hasOwnProperty(key)) {
                            validationErrors[key] = `${key}Error`;
                        }

                        if (key === 'siteContract'){
                            errorDetails.code = 422;  // Bad request for Invalid dependency ID
                        }
                    }

                    errorDetails.data = validationErrors;
                
                } else {
                    errorDetails.code = 500
                    errorDetails.data = error
                }

                results.push(errorDetails);
            }
        }else{
            results.push({ code: 201, error: false, data: site });
        }
    }

    // Check if all sites failed
    const allFailed  = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnSites.error   = true;
        returnSites.payload = results;  // Detailed errors
        returnSites.code    = 400;  // Bad request for validation errors
    } 
    else if (allSuccess) {
        returnSites.error   = false;
        returnSites.payload = results;  // Return all results, success or failure
        returnSites.code    = 201;  // Resource created, with some possible failures
    }
    else {
        returnSites.error   = true;
        returnSites.payload = results;  // Detailed errors
        returnSites.code    = 207;  // Bad request for validation errors
    }

    return returnSites;
};

exports.findById = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noSiteIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const site = await Site.findById(id).populate("siteContract");

        if (!site) {
            returnContext.error = true;
            returnContext.payload = "siteNotFound";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = site;
            returnContext.code = 200; // Success
        }

    } catch (error) {
        console.error("Error finding site by ID:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.findAll = async function (query) {
    let returnContext = {
        error: false,
        payload: [],
        code: 200 // Default success code
    };

    try {
        const sites = await Site.find(query)

        returnContext.payload = await Promise.all(sites.map(async (site) => {
            return await site.populateAndTransform();
        }));

    } catch (error) {
        console.error("Error finding sites:", error);

        returnContext.error = true;
        returnContext.payload = error;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};


exports.update = async function (id, updateData) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id || Object.keys(updateData).length === 0) {
        returnContext.error = true;
        returnContext.payload = "noUpdateDataProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const updatedSite = await Site.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedSite) {
            returnContext.error = true;
            returnContext.payload = "siteNotFoundOrUpdateFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = updatedSite;
        }

    } catch (error) {
        console.error("Error updating site:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.delete = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noSiteIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const deletedSite = await Site.findByIdAndDelete(id);

        if (!deletedSite) {
            returnContext.error = true;
            returnContext.payload = "siteNotFoundOrDeleteFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = deletedSite;
        }

    } catch (error) {
        console.error("Error deleting site:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};


exports.Check = async function(req, res) {
    //handles null error
    if (req.decoded.constructor === Object && Object.keys(req.decoded).length === 0) {
        res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
    }else{
        // Contractor info
        const dependency    = Object.entries(req.query).map(([ index, element]) => {
            return {
                id: element.id,
                name: element.name
            }
        });

        // Check if Contracts are there
        const existContracts = await Count(Contract, {"contractContractor": {
            "$in" : dependency.map((item, index) => {
                return item.id
            })
        }}, req.decoded.pack.packOptions.sites)
        if(existContracts.length){

            // Check if Sites are there
            const dependencies = existContracts.map((item, index) => {
                return { id: item.id, name: item.siteName }
            })
            const existSites   = await Count(Site, {
                "siteContract": {
                    "$in" : dependencies.map((item, index) => {
                        return item.id
                    })
                }
            }, req.decoded.pack.packOptions.sites)

            if(existSites.length){

                res.status(200).json({ error: false, message: "read", data: {
                    context: "sites",
                    name: "Site Setup",
                    values: existSites,
                    dependency: dependencies,
                    done: true,
                    action: "read"
                }});
            }else{

                res.status(200).json({ error: false, message: "create", data: {
                    context: "sites",
                    name: "Site Setup",
                    values: [],
                    dependency: [{id: req.decoded.contractor.id, name: req.decoded.contractor.id}],
                    done: false,
                    action: "create"
                } });
            }
        }else{
            res.status(200).json({ error: false, message: "create", data: {
                context: "sites",
                name: "Site Setup",
                values: [],
                dependency: [{id: req.decoded.contractor.id, name: req.decoded.contractor.id}],
                done: false,
                action: "create"
            } });
        }
    };
};