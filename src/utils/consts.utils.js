exports.populationSettingsSessions = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const userPopulation = exports.populationSettingsUsers('userId', 'USER');

        object.path = fieldName;
        object.select = 'ipAddress loginTime logoutTime isActive deviceInfo userId'; // Added potential fields
        object.populate = [
            userPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object
};

exports.populationSettingsServices = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const providerPopulation = exports.populationSettingsContractors('servicesProvider', 'USER');

        object.path = fieldName;
        object.select = 'serviceName serviceType serviceFrequency '; // Added potential fields
        object.populate = [
            providerPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsServiceRequests = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const creatorPopulation = exports.populationSettingsUsers('requestCreator', 'USER');
        const apartmentPopulation = exports.populationSettingsApartments('requestApartment', 'USER');
        const contractorPopulation = exports.populationSettingsContractors('assignedContractor', 'USER');

        object.path = fieldName;
        object.select = 'requestTitle requestStatus requestType requestCreator requestApartment assignedContractor'; // Added potential fields
        object.populate = [
            creatorPopulation,
            apartmentPopulation,
            contractorPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsRoles = function (fieldName, whoIsDemanding) {
    const object = {};
    const packOrg = exports.populationSettingsPacks('rolePack', 'USER');
    const contractOrg = exports.populationSettingsContracts('roleContractor', 'USER');
  
    // Populate fields based on who is demanding
    if (['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
        object.path = fieldName;
        object.select = 'roleName roleStatus roleType roleOrganizationType';
        object.populate = [
            exports.populationSettingsPermissions('rolePermissions', 'USER'),
            { path: 'roleOrganization', select: `${packOrg.select} ${contractOrg.select}`},
            // exports.populationSettingsRoles('roleInheritsFrom', 'USER'),
        ];
    }
  
    return object;
}

exports.populationSettingsReserveFunds = function (reserveFund, perspective = 'USER') {
    if (!reserveFund) {
        return null;
    }

    // Use toJSON if available (Mongoose object), otherwise handle plain object
    let baseObject;
    if (typeof reserveFund.toJSON === 'function') {
        baseObject = reserveFund.toJSON();
    } else {
        const { _id, ...rest } = reserveFund;
        baseObject = { id: _id?.toString() || reserveFund.id, ...rest };
    }

    // Core fields
    const formatted = {
        id: baseObject.id,
        agreement: baseObject.agreement,
        currentBalance: baseObject.currentBalance,
        transactions: baseObject.transactions?.map((transaction) => ({
            id: transaction._id?.toString(),
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            reference: transaction.reference,
            refModel: transaction.refModel,
            date: transaction.date,
        })),
        createdAt: baseObject.createdAt,
        updatedAt: baseObject.updatedAt,
    };

    // Perspective-based adjustments
    if (perspective === 'ADMIN') {
        // Admins might see additional fields if needed
        formatted.transactions = baseObject.transactions;
    }

    return formatted;
};

exports.populationSettingsPrestataires = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const userPopulation = exports.populationSettingsUsers('prestataireUser', 'USER');

        object.path = fieldName;
        object.select = 'prestataireName prestataireType prestataireStatus prestataireUser'; // Added potential fields
        object.populate = [
            userPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsPermissions = function (fieldName, whoIsDemanding) {
    const object = { };
        
        // Populate fields based on who is demanding
        if (whoIsDemanding === 'USER') {
            
            object.path = fieldName;
            object.select = 'permissionName permissionDescription permissionContext permissionAction';
        }
    
        return object;
}

exports.populationSettingsPartiesCommune = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const buildingPopulation = exports.populationSettingsBuildings('commonAreaBuilding', 'USER');

        object.path = fieldName;
        object.select = 'commonAreaName commonAreaType commonAreaStatus commonAreaBuilding'; // Added potential fields
        object.populate = [
            buildingPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsPacks = function (fieldName, whoIsDemanding) {
    const object = {};
    
    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {

        object.path = fieldName;
        object.select = 'packName packDesc packOptions packPrice packStatus packType packContexts'
        
    }

    return object;
}

exports.populationSettingsOwnershipShares = function (ownershipShare) {
    const object = { ...ownershipShare };
    
    try {
        object.id = object._id.toString();
        object.name = `Share_${object.id}`

        // Format populated fields if they are not null
        if (object.apartment && typeof object.apartment === 'object') {
            object.apartment = ApartmentsHelper.formatApartment (object.apartment);
        }

        if (object.owner && typeof object.owner === 'object') {
            object.owner = UsersHelper.formatUser(object.owner);
        }

        // Remove unwanted properties
        delete object._id;
        delete object.__v;
        delete object.createdAt;
        delete object.updatedAt;
    } catch (error) {
        console.error(`Error formatting <entity>:`, error);
        return null; // Handle the error as needed
    }

    return object;
}

exports.populationSettingsNotifications = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'
  
    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const creatorPopulation = exports.populationSettingsUsers('notificationCreator', 'USER');
        // Population for targetUser within the array element needs careful handling in the query itself,
        // but we can define the structure here.
        const targetUserPopulation = exports.populationSettingsUsers('notificationTarget.targetUser', 'USER');
  
  
        object.path = fieldName;
        object.select = 'notificationTitle notificationType notificationText notificationCreatedAt notificationCreator notificationTarget'; // Added potential fields
        object.populate = [
            creatorPopulation,
            targetUserPopulation // This defines how to populate targetUser *if* the main query targets it.
            /* Example of how it might be used in a query:
            Model.find().populate(NotificationHelper.populationSettings('someField', 'USER'))
               .populate({ // Specific population for the array element
                   path: 'someField.notificationTarget.targetUser', // Path adjusted based on fieldName
                   select: 'userFirstName userLastName'
               })
            */
        ];
    }
   // Add other 'whoIsDemanding' cases if needed
  
    return object;
  }

exports.populationSettingsModerator = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const userPopulation = exports.populationSettingsUsers('moderatorUser', 'USER');

        object.path = fieldName;
        object.select = 'moderatorLevel moderatorStatus moderatorUser'; // Added potential fields
        object.populate = [
            userPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsMissions = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        // Decide if assignee is Staff or User
        const assigneePopulation = exports.populationSettingsStaff('missionAssignee', 'USER');
        // const assigneePopulation = exports.populationSettingsUsers('missionAssignee', 'USER');
        const taskPopulation = exports.populationSettingsTasks('missionRelatedTask', 'USER');


        object.path = fieldName;
        object.select = 'missionTitle missionStatus missionDueDate missionAssignee missionRelatedTask'; // Added potential fields
        object.populate = [
            assigneePopulation,
            taskPopulation
        ];
    }
    // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsEmails = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'
  
    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        // const userPopulation = exports.populationSettingsUsers('emailUser', 'USER'); // If emailUser exists
  
        object.path = fieldName;
        object.select = 'emailSubject emailStatus emailRecipient emailSentAt emailUser'; // Added potential fields
        object.populate = [
            // userPopulation // If emailUser exists
        ]; // Usually no deep population needed for emails unless linked to a specific user record
    }
     // Add other 'whoIsDemanding' cases if needed
  
    return object;
}

exports.populationSettingsDevis = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        // Assuming ServiceRequestsHelper exists
        // const requestPopulation = ServiceRequestsHelper.populationSettings('devisRequest', 'USER');
        const providerPopulation = exports.populationSettingsContractors('devisProvider', 'USER');

        object.path = fieldName;
        object.select = 'devisTitle devisAmount devisStatus devisRequest devisProvider'; // Added potential fields
        object.populate = [
            // requestPopulation,
            providerPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsAgreements = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const userPopulation = exports.populationSettingsUsers(null, 'USER'); // Use null path for nested structure

        object.path = fieldName;
        object.select = 'agreementTitle agreementStatus agreementType agreementStartDate agreementEndDate agreementBoardMembers agreementServices'; // Added fields based on findById
        object.populate = [
            exports.populationSettingsStaff('agreementBoardMembers.syndic', 'USER'), // Populate the syndic
            exports.populationSettingsStaff('agreementBoardMembers.adjoint', 'USER'), // Populate the adjoint
            exports.populationSettingsStaff('agreementBoardMembers.tresorier', 'USER'), // Populate the tresorier
            exports.populationSettingsStaff('agreementBoardMembers.members', 'USER'), // Populate the members

            exports.populationSettingsServices('agreementServices', 'USER'), // Populate the services
        ];
    }
    // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsApartments = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {

        object.path = fieldName;
        object.select = 'apartmentName apartmentType apartmentStatus apartmentFloor apartmentBuilding'; // Added potential fields

        object.populate = [
            exports.populationSettingsBuildings('apartmentBuilding', 'USER'), // Populate the building
            exports.populationSettingsUsers('apartmentOwner', 'USER'),
            exports.populationSettingsUsers('apartmentTenants', 'USER'),
        ];
    }
    // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsBuildings = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {

        object.path = fieldName;
        object.select = 'buildingName buildingType buildingStatus buildingAddress buildingManager'; // Added potential fields
        object.populate = [
            exports.populationSettingsSites('buildingSite', 'USER'),
            exports.populationSettingsUsers('buildingManager', 'USER'),
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsContractors = function (fieldName, whoIsDemanding) {
    const object = {};

    if (whoIsDemanding === 'USER') {
        object.path = fieldName; // The field in the parent document referencing the contractor
        object.select = 'contractorTitle contractorType contractorStatus'; // Fields from Contractor model itself
        object.populate = [
            exports.populationSettingsUsers('contractorUser', 'USER'),
            exports.populationSettingsRoles('contractorRoles', 'USER'),
        ];
    }
    // Potentially add other conditions for different 'whoIsDemanding' values

    return object;
}

exports.populationSettingsContracts = function (fieldName, whoIsDemanding) {
    const object = { };
    
    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        
        object.path = fieldName;
        object.select = 'contractStatus contractVotingMechanism';   
        object.populate = [{
            path: 'contractUser', select: 'userFirstName userLastName',
        },{
            path: 'contractContractors', select: 'contractorTitle contractorType', 
            populate: { path: 'contractorUser', select: 'userFirstName userLastName' } 
        }];
    }

    return object;
}

exports.populationSettingsCotisations = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {

        object.path = fieldName;
        object.select = 'cotisationAmount cotisationDueDate cotisationStatus'; // Added potential fields
        object.populate = [
            exports.populationSettingsApartments('cotisationApartment', 'USER'),
            exports.populationSettingsUsers('cotisationOwner', 'USER'),
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsDepenses = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {

        object.path = fieldName;
        object.select = 'depenseAmount depenseDate depenseCategory depenseStatus depenseContract depenseProvider'; // Added potential fields
        object.populate = [
            exports.populationSettingsContractors('depenseContract', 'USER'),
            exports.populationSettingsContracts('depenseProvider', 'USER'),
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsOwnershipShares = function (fieldName, whoIsDemanding) {
    const populationObject = {
        path: fieldName,
        // Sensible defaults - adjust fields as needed per security/privacy requirements
        select: 'percentage effectiveDate endDate apartment owner createdAt updatedAt',
        populate: []
    };

    // Define population based on who is demanding
    // Example: USER and ADMIN might have slightly different needs
    if (whoIsDemanding === 'USER' || whoIsDemanding === 'ADMIN') {
        // Select fields suitable for users/admins
        // Exclude historicalVersions by default for potentially large arrays
        populationObject.select = 'percentage effectiveDate endDate apartment owner createdAt updatedAt';

        // Define nested populations for apartment and owner details
        // Use the respective helpers to define how these nested documents are populated
        const apartmentPopulation = exports.populationSettingsApartments('apartment', whoIsDemanding);
        const ownerPopulation = exports.populationSettingsUsers('owner', whoIsDemanding);

        populationObject.populate = [
            apartmentPopulation,
            ownerPopulation
        ];

        // Optionally include more details for ADMIN if necessary
        // if (whoIsDemanding === 'ADMIN') {
        //     populationObject.select += ' historicalVersions'; // Example: Admins might see history
        // }
    }
    // Add other 'whoIsDemanding' cases if needed (e.g., 'SYSTEM' might need fewer fields)
    /* else if (whoIsDemanding === 'SYSTEM') {
        populationObject.select = 'percentage apartment owner effectiveDate endDate';
        // System might not need nested population or specific fields
        populationObject.populate = [
             { path: 'apartment', select: '_id' }, // Just the ID
             { path: 'owner', select: '_id' }      // Just the ID
        ];
    } */

    return populationObject;
};

exports.populationSettingsReserveFunds = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        
        object.path = fieldName;
        object.select = 'currentBalance '; // Added potential fields
        object.populate = [
            exports.populationSettingsAgreements('agreement', 'USER'), // Populate agreement with specific fields,
            servicePopulation
        ];
    }
    // Add other 'whoIsDemanding' cases if needed


    // Define population based on who is demanding
    if (whoIsDemanding === 'USER' || whoIsDemanding === 'ADMIN') {
        // Select fields suitable for users/admins
        populationObject.select = 'name description balance targetAmount startDate endDate condominium createdAt updatedAt';

        // Define nested populations if needed (e.g., for the condominium)
        if (CondominiumHelper && typeof CondominiumHelper.populationSettings === 'function') {
            const condominiumPopulation = CondominiumHelper.populationSettings('condominium', whoIsDemanding);
            populationObject.populate.push(condominiumPopulation);
        }

        // Optionally populate related transactions/contributions, but be mindful of performance
        // if (whoIsDemanding === 'ADMIN' && TransactionsHelper) {
        //     const transactionsPopulation = TransactionsHelper.populationSettings('transactions', whoIsDemanding); // Assuming 'transactions' is the field name
        //     populationObject.populate.push(transactionsPopulation);
        //     populationObject.select += ' transactions'; // Add transactions to select if populating
        // }
    }
    // Add other 'whoIsDemanding' cases if needed
    /* else if (whoIsDemanding === 'SYSTEM') {
        populationObject.select = 'name balance condominium';
        populationObject.populate = [
             { path: 'condominium', select: '_id' } // Just the ID
        ];
    } */

    return object;
};

exports.populationSettingsSites = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        const contractPopulation = exports.populationSettingsContracts('siteContract', 'USER');

        object.path = fieldName;
        object.select = 'siteName siteAddress siteStatus'; // Added potential fields
        object.populate = [
            contractPopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object;
}

exports.populationSettingsStaff = function (fieldName, whoIsDemanding) {
  const object = {}; // Removed extra 'const'

  // Populate fields based on who is demanding
  if (whoIsDemanding === 'USER') {
    const userPopulation = exports.populationSettingsUsers('staffUser', 'USER');
    const contractorPopulation = exports.populationSettingsContractors('staffContractor', 'USER');
    const rolesPopulation = exports.populationSettingsRoles('staffRoles', 'USER');

    object.path = fieldName;
    object.select = 'staffStatus staffUser staffContractor staffRoles'; // Added potential fields
    object.populate = [
      userPopulation,
      contractorPopulation,
      rolesPopulation
    ];
  }
  // Add other 'whoIsDemanding' cases if needed

  return object;
}

exports.populationSettingsTasks = function (fieldName, whoIsDemanding) {
    const object = {}; // Removed extra 'const'

    // Populate fields based on who is demanding
    if (whoIsDemanding === 'USER') {
        // Decide if assignee is Staff or User
        const assigneePopulation = exports.populationSettingsStaff('taskAssignee', 'USER');
        const servicePopulation = exports.populationSettingsServices('taskRelatedService', 'USER');
        // const assigneePopulation = exports.populationSettingsUsers('taskAssignee', 'USER');

        object.path = fieldName;
        object.select = 'taskTitle taskStatus taskPriority taskDueDate'; // Added potential fields
        object.populate = [
            assigneePopulation,
            servicePopulation
        ];
    }
     // Add other 'whoIsDemanding' cases if needed

    return object
}

exports.populationSettingsTwoFAs = function (fieldName, whoIsDemanding) {
  const object = {}; // Removed extra 'const'

  // Populate fields based on who is demanding
  if (whoIsDemanding === 'USER') {
      const userPopulation = exports.populationSettingsUsers('twoFAUser', 'USER');

      object.path = fieldName;
      // Select only non-sensitive fields. Avoid selecting twoFAPassCode unless necessary.
      object.select = 'twoFAStatus twoFALastGeneratedAt twoFAFailedAttempts';
      object.populate = [
          userPopulation
      ];
  }
   // Add other 'whoIsDemanding' cases if needed

  return object;
}

exports.populationSettingsUsers = function (fieldName, whoIsDemanding) {
    const object = { };

    const pack = exports.populationSettingsPacks('userPack', 'USER')
    const roles = exports.populationSettingsRoles('userRoles', 'USER')
    
    if (whoIsDemanding === 'USER') {

      object.path = fieldName;
      
      object.select = 'userFirstName userLastName';   
      
      object.populate = [{
          ...pack,
      },{
          ...roles,
      }];

    }

    return object;
}