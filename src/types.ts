export interface Manufacturer {
    Code: string;
    Name: string;
}

export interface Ship {
    ClassName: string;
    Name: string;
    Description: string;
    Career: string;
    Role: string;
    Size: number;
    Cargo: number;
    Mass: number;
    Manufacturer: Manufacturer;
}

export interface Port {
    Name: string;
    DisplayName?: string;
    Position?: string;
    MaxSize: number;
    MinSize: number;
    Types: string[];
    InstalledItem?: {
        Name: string;
        ClassName: string;
        Size: number;
    };
}

export interface Item {
    className: string;
    itemName: string;
    type: string;
    subType: string;
    size: number;
    grade: number;
    name: string;
    manufacturer?: string;
    stdItem?: {
        Description?: string;
        Manufacturer?: {
            Name: string;
        }
    };
}

export interface FleetShip {
    id: string; // Unique instance ID
    shipClass: string;
    name: string; // User defined name
    customLoadout: Record<string, string>; // Port Name -> Item ClassName
}
