import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "demo-api-key",
  projectId: "demo-project",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8080);

async function seed() {
  console.log("Starting seed process...");
  try {
    // 1. Create Super Admin
    console.log("Creating Super Admin user...");
    const userCredential = await createUserWithEmailAndPassword(auth, "superadmin@company.com", "Admin@1234");
    const uid = userCredential.user.uid;

    await setDoc(doc(db, "users", uid), {
      email: "superadmin@company.com",
      name: "System Super Admin",
      role: "SUPER_ADMIN",
      department: "Management",
      isActive: true,
      createdAt: new Date().toISOString()
    });
    console.log("Super Admin created.");

    // Create additional test users for all roles to help verification later
    const roles = [
      { email: "admin@company.com", role: "ADMIN", name: "System Admin", dept: "IT" },
      { email: "initiator@company.com", role: "INITIATOR", name: "Sales User", dept: "Sales" },
      { email: "checker@company.com", role: "CHECKER", name: "Quality Check", dept: "Quality" },
      { email: "approver@company.com", role: "APPROVER", name: "Director Bob", dept: "Management" },
      { email: "engineering@company.com", role: "ENGINEERING", name: "Eng Team", dept: "Engineering" },
    ];

    for (const r of roles) {
      console.log(`Creating ${r.role} user: ${r.email}...`);
      try {
        const uc = await createUserWithEmailAndPassword(auth, r.email, "Password123!");
        await setDoc(doc(db, "users", uc.user.uid), {
          email: r.email,
          name: r.name,
          role: r.role,
          department: r.dept,
          isActive: true,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          console.log(`${r.email} already exists, skipping.`);
        } else {
          throw e; // re-throw if it's another error
        }
      }
    }


    // 2. Sample Customers
    console.log("Creating sample customers...");
    const customers = [
      "Mahindra & Mahindra", "TATA Motors", "Ashok Leyland", 
      "Escorts Kubota", "Force Motors"
    ];
    for (const c of customers) {
      await setDoc(doc(db, "customers", c.replace(/\s+/g, '-').toLowerCase()), {
        name: c,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }

    // 3. Part Categories
    console.log("Creating part categories...");
    const categories = [
      "Propshaft Assembly", "CV Joint", "Clutch Assembly", 
      "Differential Component", "Universal Joint", "Drive Axle", 
      "Gear", "Bearing", "Seal", "Other"
    ];
    for (const cat of categories) {
      await setDoc(doc(db, "master_data/part_categories/items", cat.replace(/\s+/g, '-').toLowerCase()), {
        name: cat,
        isActive: true
      });
    }

    // 4. Departments
    console.log("Creating departments...");
    const departments = ["Sales", "Engineering", "Quality", "Management", "Operations"];
    for (const d of departments) {
      await setDoc(doc(db, "master_data/departments/items", d.toLowerCase()), {
        name: d,
        isActive: true
      });
    }

    console.log("Seed process completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
