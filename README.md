# Structure         config/
    ->  file.js     Where to Find and Put all config files
                    ex:(DB - JWT - Hashing Keys ... )

# Structure         src/

    ->  controllers Where to Find and Put all CRUD functions
                    ex:(Create - Find by ID - Update - Delete ... )
                    
    ->  middelware  Where to Find and Put all the Operations to check the user's validity
                    ex:(is Authenticated - to check Assigned Role - Verify Token  ... )
                    
    ->  models      Where to Find and Put all database tables
                    ex:(users - roles - projects ... )
                    
    ->  routes      Where to Find and Put all the HTTP methods and thier links for the Backend API
                    ex:(GET - POST - PUT - DELETE ... )
                    
    ->  validation  Where to Find and Put the user's INPUTS related validation mechanizms 
                    ex:(Validate Signup data - Validate Signin data - Validate Search data ... )

                    
# notes
check Responses in BackEnd\src\controllers\user.controller.js 

# To do
- When create user, Assign ROLE based on PACK

- Manage Hierarchie

- Handle ROLE on PROJECT relatioship

# AI hooks
- BE # CRUD Response Codes - Refactor:  https://chatgpt.com/share/6702e2ec-8d6c-8011-97a0-4affc8b54ef1

# Usable:
## Controller Function Pattern:

exports.action = async function (req, res) {
    /*
    action = could be ( create, update, delete, findOne, findAll ... etc) 
    context = could be ( users, sites, contracts, buildings ... etc) 
    fromData = is the form sent from the client 
    validateContextInput = is a validation function predefined for each Context 
    */
    const formData = req.body?.formData?.context;

    if (!formData || !Array.isArray(formData) || formData.length === 0) {
        return res.status(400).json({ error: true, message: "Invalid or empty Input Array." });
    }
    
    try {

        // Validate input data 
        const { errors, isValid, code } = validateContextInput(formData);
    
        if (!isValid) {
            return res.status(code).json({ error: true, message: "Validation failed", data: errors, });
        }

        // Call the corresponding helper function 
        const contextResult = await ContextHelpers.action(formData /*, args */);

        // Validate Action results data
        if (contextResult.error) {
            return res.status(contextResult.code).json({ error: true, message: contextResult.payload, data: contextResult.payload });
        } else if (!contextResult.payload) {
            return res.status(422).json({ error: true, message: "ContextUnfound", data: { userContext: "someContextUnfound" } });
        }

        const createdContext = contextResult.payload;

        // Respond with the result from the helper function
        return res.status(400).json({ error: true, message: "validationFailed", code: 400, data: createdContext });

    } catch (error) {
        console.error("Error in Action Context creation:", error);
        return res.status(500).json({ error: true, message: "Internal server error", data: error.message, });
    }
};

## Helper Function Pattern:

exports.action = async function (params, args) {
    /*
    action = could be ( create, update, delete, findOne, findAll ... etc) : func 
    context = could be ( users, sites, contracts, buildings ... etc) : String 
    params = is the form sent from the client : Array 
    */

    let returnContext = {
        error: false, payload: null, code: 200 || 201// default code for successful creation 
    };

    // Check if 'params' data is provided 
    if (!params || !Array.isArray(params)) {
        returnContext.error = true;
        returnContext.payload = "noParamsProvided"; // Consistent payload for missing user data 
        returnContext.code = Array.isArray(params) ? 400 : 500; // Bad request 
        return returnContext; // Early return on error 
    } 
     
    const results = [];

    // Loop over each site in the array and attempt to insert it 
    for (const [index, param] of params.entries()) {
        if (param.id == '') {
            try {
                // Create new param document 
                const docParam = await Model.action(param);
                results.push({ code: 201, error: false, data: docParam });
            } 
            catch (error) {
                console.error("Error creating document:", error);

                const errorDetails = { code: 400, error: true, };

                // Handle validation errors specifically 
                if (error?.errors && Object.keys(error.errors).length) {
                    const validationErrors = {};

                    for (const key in error.errors) {
                        if (error.errors.hasOwnProperty(key)) {
                            validationErrors[key] = `${ key }Error`;
                        } 
                        
                        if (key === 'some foreign key ID') {
                            errorDetails.code = 422;// Bad request for Invalid dependency ID 
                        }
                    } 
                    
                    errorDetails.data = validationErrors;
                } else { 
                    errorDetails.code = 500 
                    errorDetails.data = error 
                } 
                
                results.push(errorDetails);
            }
        } else {
            results.push({ code: 201, error: false, data: param });
        }
    }
    // Check if all sites failed 
    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);
    
    if (allFailed) {
        returnContext.error = true;
        returnContext.payload = results;// Detailed errors 
        returnContext.code = 400; // Bad request for validation errors 
    } else if (allSuccess) {
        returnContext.error = false;
        returnContext.payload = results; // Return all results, success or failure 
        returnContext.code = 201; // Resource created, with some possible failures 
    } else { 
        returnContext.error = true;
        returnContext.payload = results; // Detailed errors 
        returnContext.code = 207; // Bad request for validation errors 
    } 
    
    return returnContext;
};