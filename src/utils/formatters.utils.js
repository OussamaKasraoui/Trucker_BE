const formatAgreement = function(agreement, whoIsDemanding="USER") {
    if (!agreement) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (agreement._id) {
                object.id = agreement._id.toString();
            }
            
            if (object.agreementStart || object.agreementEnd) {
                object.name = `${object.agreementStart || 'No Start'} ${object.agreementEnd || 'No End'}`;
            }
            
            // Basic date formatting with null checks
            if (object.agreementStart instanceof Date) {
                object.agreementStart = object.agreementStart.toISOString().split('T')[0];
            }
            
            if (object.agreementEnd instanceof Date) {
                object.agreementEnd = object.agreementEnd.toISOString().split('T')[0];
            }
            
            if (object.agreementSite) {
                object.agreementSite = formatSite(object.agreementSite);
            }
        }
        
        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (object.agreementServices && Array.isArray(object.agreementServices)) {
                object.agreementServices = object.agreementServices
                    .filter(service => service) // Filter out null/undefined
                    .map(s => formatService(s));
            }
            
            if (object.agreementContract) {
                object.agreementContract = formatContract(object.agreementContract);
            }
            
            if (object.agreementContractor && Array.isArray(object.agreementContractor)) {
                object.agreementContractor = object.agreementContractor
                    .filter(contractor => contractor)
                    .map(c => formatContractor(c));
            }
        }
        
        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (object.agreementBoardMembers) {
                object.agreementBoardMembers = {
                    syndic: object.agreementBoardMembers?.syndic ? 
                        formatStaff(object.agreementBoardMembers.syndic) : null,
                    adjoint: object.agreementBoardMembers?.adjoint ? 
                        formatStaff(object.agreementBoardMembers.adjoint) : null,
                    tresorier: object.agreementBoardMembers?.tresorier ? 
                        formatStaff(object.agreementBoardMembers.tresorier) : null,
                    members: object.agreementBoardMembers?.members?.filter(m => m)
                        .map(m => formatStaff(m)) || []
                };
            }
            
            if (agreement.__v !== undefined) {
                object.__v = agreement.__v;
            }
            
            if (agreement.createdAt) {
                object.createdAt = agreement.createdAt;
            }
            
            if (agreement.updatedAt) {
                object.updatedAt = agreement.updatedAt;
            }
        }
        
    } catch (error) {
        console.error(`Error formatting agreement:`, error);
        return null;
    }
    
    return object;
};

const formatApartment = function (apartment, whoIsDemanding="USER") {
    if (!apartment) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (apartment._id) {
                object.id = apartment._id.toString();
            }
            
            if (apartment.apartmentName) {
                object.name = apartment.apartmentName;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if(apartment.apartmentUser){
                object.apartmentUser = formatUser(apartment.apartmentUser, whoIsDemanding);
            }
    
            if(apartment.apartmentOwner){
                object.apartmentOwner = formatUser(apartment.apartmentOwner, whoIsDemanding);
            }
    
            if(apartment.apartmentBuilding){
                object.apartmentBuilding =  formatBuilding(apartment.apartmentBuilding, whoIsDemanding);
            }
    
            if(apartment.apartmentSite){
                object.apartmentSite = formatSite(apartment.apartmentSite, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if(apartment.apartmentContract){
                object.apartmentContract = formatContract(apartment.apartmentContract, whoIsDemanding);
            }

            if (apartment.__v !== undefined) {
                object.__v = apartment.__v;
            }
            
            if (apartment.createdAt) {
                object.createdAt = apartment.createdAt;
            }
            
            if (apartment.updatedAt) {
                object.updatedAt = apartment.updatedAt;
            }
        }
    } catch (error) {
        console.error("Error formatting apartment:", error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatBuilding = function (building, whoIsDemanding="USER") {
    if (!building) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (building._id) {
                object.id = building._id.toString();
            }
            
            if (building.buildingName) {
                object.name = building.buildingName;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (building.buildingSite) {
                object.buildingSite =  formatSite(building.buildingSite, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (building.buildingContract) {
                object.buildingContract =  formatContract(building.buildingContract, whoIsDemanding);
            }

            if (building.__v !== undefined) {
                object.__v = building.__v;
            }
            
            if (building.createdAt) {
                object.createdAt = building.createdAt;
            }
            
            if (building.updatedAt) {
                object.updatedAt = building.updatedAt;
            }
        }
    } catch (error) {
        console.error("Error formatting building:", error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatContractor = function (contractor, whoIsDemanding="USER") {
    if (!contractor) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contractor.id || contractor._id) {
                object.id = contractor.id || contractor._id.toString();
            }
            
            if (contractor.contractorTitle) {
                object.name = contractor.contractorTitle;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contractor.contractorUser && typeof contractor.contractorUser === 'object') {
                object.contractorUser = formatUser(contractor.contractorUser, whoIsDemanding);
            }
    
            if (contractor.contractorRoles && Array.isArray(contractor.contractorRoles)) {
                object.contractorRoles = formatRole(contractor.contractorRoles, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (contractor.__v !== undefined) {
                object.__v = contractor.__v;
            }
            
            if (contractor.createdAt) {
                object.createdAt = contractor.createdAt;
            }
            
            if (contractor.updatedAt) {
                object.updatedAt = contractor.updatedAt;
            }
        }
    }
    catch (error) {
        console.error("Error formatting contractor:", error);
        return null;
    }

  return object;
};

const formatContract = function (contract, whoIsDemanding="USER") {
    if (!contract) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contract._id) {
                object.id = contract._id.toString();
            }
            
            object.name = `Contract_${object.id}`;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contract.contractUser) {
                object.contractUser = formatUser(contract.contractUser, whoIsDemanding);
            }
    
            if (contract.contractContractors && Array.isArray(contract.contractContractors)) {
                object.contractContractors = contract.contractContractors.map(c => formatContractor(c, whoIsDemanding));
            } else {
                object.contractContractors = []
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (contract.__v !== undefined) {
                object.__v = contract.__v;
            }
            
            if (contract.createdAt) {
                object.createdAt = contract.createdAt;
            }
            
            if (contract.updatedAt) {
                object.updatedAt = contract.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting contract:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatCotisation = function (cotisation, whoIsDemanding="USER") {
    if (!cotisation) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (cotisation.id || cotisation._id) {
                object.id = cotisation.id || cotisation._id.toString();
            }
            
            object.name = `${cotisation.cotisationType}_${cotisation?.cotisationAppartment}`;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (cotisation.cotisationApartment) {
                object.cotisationApartment = formatApartment(cotisation.cotisationApartment, whoIsDemanding);
            }
    
            if (cotisation.cotisationOwner) {
                object.cotisationOwner = formatUser(cotisation.cotisationOwner, whoIsDemanding);
            }
    
            if (cotisation.ownershipShare) {
                object.ownershipShare = formatOwnershipShare(cotisation.ownershipShare, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (cotisation.__v !== undefined) {
                object.__v = cotisation.__v;
            }
            
            if (cotisation.createdAt) {
                object.createdAt = cotisation.createdAt;
            }
            
            if (cotisation.updatedAt) {
                object.updatedAt = cotisation.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting cotisation:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatDepense = function (depense, whoIsDemanding="USER") {
    if (!depense) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (depense.id || depense._id) {
                object.id = depense.id || depense._id.toString();
            }
            
            if (depense.depenseName) {
                object.name = depense.depenseName;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (depense.depenseStuff) {
                object.depenseStuff = formatStaff(depense.depenseStuff, whoIsDemanding);
            }
    
            if (depense.depenseBenificiaire) {
                object.depenseBenificiaire = formatContractor(depense.depenseBenificiaire, whoIsDemanding);
            }
    
            if (depense.depenseMission) {
                object.depenseMission = formatMission(depense.depenseMission, whoIsDemanding);
            }
    
            if (depense.depenseTask) {
                object.depenseTask = formatTask(depense.depenseTask, whoIsDemanding);
            }
    
            if (depense.reserveFundSource) {
                object.reserveFundSource = formatReserveFund(depense.reserveFundSource, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (depense.agreement) {
                object.agreement = formatAgreement(depense.agreement, whoIsDemanding);
            }

            if (depense.__v !== undefined) {
                object.__v = depense.__v;
            }
            
            if (depense.createdAt) {
                object.createdAt = depense.createdAt;
            }
            
            if (depense.updatedAt) {
                object.updatedAt = depense.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting depense:`, error);
        return null; // Handle the error as needed
    }
    
    return object;
};

const formatDevis = function (devis, whoIsDemanding="USER") {
    if (!devis) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (devis.id || devis._id) {
                object.id = devis.id || devis._id.toString();
            }
            
            object.name = devis.devisServiceRequest?.name;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (devis.devisMissions && Array.isArray(devis.devisMissions)) {
                object.devisMissions = devis.devisMissions.map(mission => formatMission(mission, whoIsDemanding));
            }
    
            if (devis.devisUser) {
                object.devisUser = formatUser(devis.devisUser, whoIsDemanding);
            }
    
            if (devis.devisServiceRequest) {
                object.devisServiceRequest = formatServiceRequest(devis.devisServiceRequest, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (devis.__v !== undefined) {
                object.__v = devis.__v;
            }
            
            if (devis.createdAt) {
                object.createdAt = devis.createdAt;
            }
            
            if (devis.updatedAt) {
                object.updatedAt = devis.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting devis:`, error);
        return null; // Handle the error as needed
    }
    
    return object;
};

const formatMission = function (mission, whoIsDemanding="USER") {
    if (!mission) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (mission.id || mission._id) {
                object.id = mission.id || mission._id.toString();
            }
            
            if (mission.missionName) {
                object.name = mission.missionName;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (mission.missionContractor) {
                object.missionContractor = formatContractor(mission.missionContractor, whoIsDemanding);
            }
            if (mission.missionSite) {
                object.missionSite = formatSite(mission.missionSite, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (mission.__v !== undefined) {
                object.__v = mission.__v;
            }
            
            if (mission.createdAt) {
                object.createdAt = mission.createdAt;
            }
            
            if (mission.updatedAt) {
                object.updatedAt = mission.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting mission:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatModerator = function (moderator, whoIsDemanding="USER") {
    if (!moderator) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (moderator.id || moderator._id) {
                object.id = moderator.id || moderator._id.toString();
            }
            
            object.name = moderator.id || moderator._id.toString();
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (moderator.__v !== undefined) {
                object.__v = moderator.__v;
            }
            
            if (moderator.createdAt) {
                object.createdAt = moderator.createdAt;
            }
            
            if (moderator.updatedAt) {
                object.updatedAt = moderator.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting moderator:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatNotification = function (notification, whoIsDemanding="USER") {
    if (!notification) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (notification.id || notification._id) {
                object.id = notification.id || notification._id.toString();
            }
            
            if (notification.notificationTitle) {
                object.name = notification.notificationTitle;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (notification.notificationCreator) {
                object.notificationCreator = formatUser(notification.notificationCreator, whoIsDemanding);
            }
    
            if (notification.notificationTarget && Array.isArray(notification.notificationTarget)) {
                object.notificationTarget = notification.notificationTarget.map(target => {
                    if (target.targetUser) {
                        target.targetUser = formatUser(target.targetUser, whoIsDemanding);
                    }
                    return target;
                });
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (notification.__v !== undefined) {
                object.__v = notification.__v;
            }
            
            if (notification.createdAt) {
                object.createdAt = notification.createdAt;
            }
            
            if (notification.updatedAt) {
                object.updatedAt = notification.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting notification:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatOwnershipShare = function (ownershipShare, whoIsDemanding="USER") {
    if (!ownershipShare) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (ownershipShare.id || ownershipShare._id) {
                object.id = ownershipShare.id || ownershipShare._id.toString();
            }
            
            object.name = `Share_${object.id}`
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (ownershipShare.apartment && typeof ownershipShare.apartment === 'object') {
                object.apartment = formatApartment (ownershipShare.apartment, whoIsDemanding);
            }
    
            if (ownershipShare.owner && typeof ownershipShare.owner === 'object') {
                object.owner = formatUser(ownershipShare.owner, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (ownershipShare.__v !== undefined) {
                object.__v = ownershipShare.__v;
            }
            
            if (ownershipShare.createdAt) {
                object.createdAt = ownershipShare.createdAt;
            }
            
            if (ownershipShare.updatedAt) {
                object.updatedAt = ownershipShare.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting ownershipShare:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatPack = function (pack, whoIsDemanding="USER") {
    if (!pack) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (pack.id || pack._id) {
                object.id = pack.id || pack._id.toString();
            }
            
            if (pack.packName) {
                object.name = pack.packName;
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (pack.__v !== undefined) {
                object.__v = pack.__v;
            }
            
            if (pack.createdAt) {
                object.createdAt = pack.createdAt;
            }
            
            if (pack.updatedAt) {
                object.updatedAt = pack.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting pack:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatPartiesCommune = function (partiesCommune, whoIsDemanding="USER") {
    if (!partiesCommune) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (partiesCommune.id || partiesCommune._id) {
                object.id = partiesCommune.id || partiesCommune._id.toString();
            }
            
            if (partiesCommune.partiesCommuneName) {
                object.name = partiesCommune.partiesCommuneName;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (partiesCommune.partiesCommuneImmeuble) {
                object.partiesCommuneImmeuble = formatBuilding(partiesCommune.partiesCommuneImmeuble, whoIsDemanding);
            }
    
            if (partiesCommune.partiesCommunePrestataire) {
                object.partiesCommunePrestataire = formatContractor (partiesCommune.partiesCommunePrestataire, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (partiesCommune.__v !== undefined) {
                object.__v = partiesCommune.__v;
            }
            
            if (partiesCommune.createdAt) {
                object.createdAt = partiesCommune.createdAt;
            }
            
            if (partiesCommune.updatedAt) {
                object.updatedAt = partiesCommune.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting partiesCommune:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatPermission = function (permissions, whoIsDemanding="USER") {
    if (!Array.isArray(permissions)) {
        console.error("Input is not an array");
        return [];
    }

    return permissions.map(permission => {
        if (!permission) return null;
        const object = {}
        
        try {
            // Basic info for all users
            if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
                if (permission.id || permission._id) {
                    object.id = permission.id || permission._id.toString();
                }
                
                if (permission.permissionName) {
                    object.name = permission.permissionName;
                }
            }

            // Sensitive info for admins only
            if(['ADMIN'].includes(whoIsDemanding)) {
                if (permission.__v !== undefined) {
                    object.__v = permission.__v;
                }
                
                if (permission.createdAt) {
                    object.createdAt = permission.createdAt;
                }
                
                if (permission.updatedAt) {
                    object.updatedAt = permission.updatedAt;
                }
            }
        } catch (error) {
            console.error(`Error formatting permission:`, error);
            return null; // Handle the error as needed
        }

        return object;
    });
};

const formatPrestataire = function (prestataire, whoIsDemanding="USER") {
    if (!prestataire) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (prestataire.id || prestataire._id) {
                object.id = prestataire.id || prestataire._id.toString();
            }
            
            object.name = prestataire.id || prestataire._id.toString();
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (prestataire.__v !== undefined) {
                object.__v = prestataire.__v;
            }
            
            if (prestataire.createdAt) {
                object.createdAt = prestataire.createdAt;
            }
            
            if (prestataire.updatedAt) {
                object.updatedAt = prestataire.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting prestataire:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatReserveFund = function (reserveFund, whoIsDemanding="USER", perspective = 'USER') {
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

const formatRole = function (roles, whoIsDemanding="USER") {
    if (!Array.isArray(roles)) {
        console.error("Input is not an array");
        return [];
    }

    return roles.map(role => {
        if (!role) return null;
        const object = {}

        try {
            // Sensitive info for admins only
            if(['ADMIN'].includes(whoIsDemanding)) {

                if (role.__v !== undefined) {
                    object.__v = role.__v;
                }
                
                if (role.createdAt) {
                    object.createdAt = role.createdAt;
                }
                
                if (role.updatedAt) {
                    object.updatedAt = role.updatedAt;
                }
            }

            // Additional info for managers and admins
            if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
                if (role.roleType) {
                    object.roleType = role.roleType;
                }

                if (role.rolePermissions && Array.isArray(role.rolePermissions)) {
                    object.rolePermissions = formatPermission(role.rolePermissions, whoIsDemanding)
                } else {
                    object.rolePermissions = [];
                }
        
                if (role.roleInheritsFrom && Array.isArray(role.roleInheritsFrom)) {
                    object.roleInheritsFrom = role.roleInheritsFrom.map(inheritedRole =>
                        formatRole([inheritedRole], whoIsDemanding)[0]
                    );
                } else {
                    object.roleInheritsFrom = [];
                }
            }

            // Basic info for all users
            if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
                if (role.id || role._id) {
                    object.id = role.id || role._id.toString();
                }
                
                if (role.roleName) {
                    object.name = role.roleName;
                }

                if (role.roleStatus) {
                    object.roleStatus = role.roleStatus;
                }

                if (role.roleContractor) {
                    object.roleContractor = formatContractor (role.roleContractor, whoIsDemanding);
                }
        
                if (role.roleOrganization) {
                    if(role.roleOrganizationType === 'Packs'){
                        object.roleOrganization = formatPack (role.roleOrganization, whoIsDemanding);
                    
                    }else if(role.roleOrganizationType === 'Contracts'){
                        object.roleOrganization = formatContract (role.roleOrganization, whoIsDemanding);
                    }
                }

                if (role.roleOrganizationType) {   
                    object.roleOrganizationType = role.roleOrganizationType;
                }
            }
        } catch (error) {
            console.error(`Error formatting role:`, error);
            return null;
        }

        return object;
    });
};

const formatServiceRequest = function (serviceRequest, whoIsDemanding="USER") {
    if (!serviceRequest) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (serviceRequest.id || serviceRequest._id) {
                object.id = serviceRequest.id || serviceRequest._id.toString();
            }
            
            object.name = serviceRequest.id || serviceRequest._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (serviceRequest.serviceRequestUser) {
                object.serviceRequestUser = formatUser(serviceRequest.serviceRequestUser, whoIsDemanding);
            }
    
            if (serviceRequest.serviceRequestMission) {
                object.serviceRequestMission = formatMission (serviceRequest.serviceRequestMission, whoIsDemanding);
            }
    
            if (serviceRequest.serviceRequestSite) {
                object.serviceRequestSite = formatSite(serviceRequest.serviceRequestSite, whoIsDemanding);
            }
    
            if (serviceRequest.assignedContractor) {
                object.assignedContractor = formatContractor(serviceRequest.assignedContractor, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (serviceRequest.relatedDevis) {
                object.relatedDevis = formatDevis(serviceRequest.relatedDevis, whoIsDemanding);
            }

            if (serviceRequest.__v !== undefined) {
                object.__v = serviceRequest.__v;
            }
            
            if (serviceRequest.createdAt) {
                object.createdAt = serviceRequest.createdAt;
            }
            
            if (serviceRequest.updatedAt) {
                object.updatedAt = serviceRequest.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting serviceRequest:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatService = function (service, whoIsDemanding="USER") {
    if (!service) return null;

    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (service.id || service._id) {
                object.id = service.id || service._id.toString();
            }
            
            object.name = service.servicesName;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (service.servicesProvider) {
                object.servicesProvider = formatContractor(service.servicesProvider, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (service.__v !== undefined) {
                object.__v = service.__v;
            }
            
            if (service.createdAt) {
                object.createdAt = service.createdAt;
            }
            
            if (service.updatedAt) {
                object.updatedAt = service.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting service:`, error);
        return null;
    }

    return object;
};

const formatSession = function (mission, whoIsDemanding="USER") {
    if (!session) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (session.id || session._id) {
                object.id = session.id || session._id.toString();
            }
            
            object.name = session.id || session._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (session.userId && typeof session.userId === 'object') {
                object.userId = formatUser(session.userId, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (session.__v !== undefined) {
                object.__v = session.__v;
            }
            
            if (session.createdAt) {
                object.createdAt = session.createdAt;
            }
            
            if (session.updatedAt) {
                object.updatedAt = session.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting session:`, error);
        return null;
    }

    return object;
};

const formatSite = function (site, whoIsDemanding="USER") {
    if (!site) return null;

    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (site._id) {
                object.id = site._id.toString();
            }
            
            if (site.siteName) {
                object.name = site.siteName;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (site.siteContract) {
                object.siteContract = formatContract(site.siteContract, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (site.__v !== undefined) {
                object.__v = site.__v;
            }
            
            if (site.createdAt) {
                object.createdAt = site.createdAt;
            }
            
            if (site.updatedAt) {
                object.updatedAt = site.updatedAt;
            }
        }
    } catch (error) {
        console.error("Error formatting site:", error);
        return null;
    }

    return object;
};

const formatStaff = function (staff, whoIsDemanding="USER") {
    if (!staff) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (staff.id || staff._id) {
                object.id = staff.id || staff._id.toString();
            }
            
            object.name = `${staff?.staffUser?.userFirstName} ${staff?.staffUser?.userLastName}`;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (staff?.staffUser) {
                object.staffUser = formatUser(staff.staffUser, whoIsDemanding);
            }
    
            if (staff?.staffRoles && Array.isArray(staff.staffRoles)) {
                object.staffRoles = formatRole(staff.staffRoles, whoIsDemanding);
            } else {
                object.staffRoles = [];
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (staff?.staffContractor) {
                object.staffContractor = formatContractor(staff.staffContractor, whoIsDemanding);
            }

            if (staff.__v !== undefined) {
                object.__v = staff.__v;
            }
            
            if (staff.createdAt) {
                object.createdAt = staff.createdAt;
            }
            
            if (staff.updatedAt) {
                object.updatedAt = staff.updatedAt;
            }
        }

    } catch (error) {
        console.error(`Error formatting staff:`, error);
        return null;
    }

    return object;
};

const formatTask = function (task, whoIsDemanding="USER") {
    if (!task) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (task.id || task._id) {
                object.id = task.id || task._id.toString();
            }
            
            object.name = task.id || task._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (task.taskMission) {
                object.taskMission = formatMission (task.taskMission, whoIsDemanding);
            }
    
            if (task.taskSite) {
                object.taskSite = formatSite (task.taskSite, whoIsDemanding);
            }
    
            if (task.relatedApartment) {
                object.relatedApartment = formatApartment(task.relatedApartment, whoIsDemanding);
            }
    
            if (task.taskStuff && Array.isArray(task.taskStuff)) {
                object.taskStuff = task.taskStuff.map(staff => formatStaff(staff, whoIsDemanding));
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (task.taskNotes && Array.isArray(task.taskNotes)) {
                object.taskNotes = task.taskNotes.map(note => {
                    if (note.author) {
                        note.author = formatUser(note.author, whoIsDemanding);
                    }
                    return note;
                });
            }

            if (task.__v !== undefined) {
                object.__v = task.__v;
            }
            
            if (task.createdAt) {
                object.createdAt = task.createdAt;
            }
            
            if (task.updatedAt) {
                object.updatedAt = task.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting task:`, error);
        return null;
    }

    return object;
};

const formatTwoFA = function (twoFA, whoIsDemanding="USER") {
    if (!twoFA) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (twoFA.id || twoFA._id) {
                object.id = twoFA.id || twoFA._id.toString();
            }
            
            object.name = twoFA.id || twoFA._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (twoFA.twoFAUser && typeof twoFA.twoFAUser === 'object') {
                object.twoFAUser = formatUser(twoFA.twoFAUser, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (twoFA.__v !== undefined) {
                object.__v = twoFA.__v;
            }
            
            if (twoFA.createdAt) {
                object.createdAt = twoFA.createdAt;
            }
            
            if (twoFA.updatedAt) {
                object.updatedAt = twoFA.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting twoFA:`, error);
        return null;
    }

    return object;
};

const formatUser = function (user, whoIsDemanding="USER") {
  const object = {}

  try {

    if( ['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)){
        object.id            = user.id || user._id.toString();
        object.name          = `${user.userFirstName} ${user.userLastName}`;
        object.userFirstName = user.userFirstName;
        object.userLastName  = user.userLastName;
        object.userStatus    = user.userStatus;
    }

    if( ['MANAGER', 'ADMIN'].includes(whoIsDemanding)){
        object.userAddress  = user.userAddress;
        object.userEmail    = user.userEmail;
        object.userPhone    = user.userPhone;
        object.userRef      = user.userRef;

        // Format userPack if not null
        if (user.userPack) {
            object.userPack = formatPack(user.userPack)
        }

        // Format userRoles if not null
        if (user.userRoles && Array.isArray(user.userRoles)) {
            object.userRoles = formatRole(user.userRoles)
        }
    }

    if( ['ADMIN'].includes(whoIsDemanding)){
        object.__v          = user.__v;
        object.createdAt    = user.createdAt;
        object.updatedAt    = user.updatedAt;
    }

  } catch (error) {
    console.error(`Error formatting <entity>:`, error);
  }

  return object;
}

// Export all functions
module.exports = {
    formatAgreement,
    formatApartment,
    formatBuilding,
    formatContractor,
    formatContract,
    formatCotisation,
    formatDepense,
    formatDevis,
    formatMission,
    formatModerator,
    formatNotification,
    formatOwnershipShare,
    formatPack,
    formatPartiesCommune,
    formatPermission,
    formatPrestataire,
    formatReserveFund,
    formatRole,
    formatServiceRequest,
    formatService,
    formatSession,
    formatSite,
    formatStaff,
    formatTask,
    formatTwoFA,
    formatUser
};