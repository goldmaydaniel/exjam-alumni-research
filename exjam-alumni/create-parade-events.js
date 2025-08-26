const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://yzrzjagkkycmdwuhrvww.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createParadeEvents() {
  console.log("Creating AFMS/AFGMS Passing Out Parade events...");

  try {
    // First, check and delete existing events
    const { data: existingEvents, error: fetchError } = await supabase
      .from("Event")
      .select("id, title");

    if (fetchError) {
      console.error("Error fetching events:", fetchError);
    } else if (existingEvents && existingEvents.length > 0) {
      console.log(`Found ${existingEvents.length} existing events, removing duplicates...`);
      const { error: deleteError } = await supabase
        .from("Event")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) {
        console.error("Error deleting events:", deleteError);
      }
    }

    const events = [
      {
        title: "President General's Conference 2025",
        shortDescription: "The flagship annual gathering of all ExJAM members worldwide",
        description:
          "Join us for the President General's Conference 2025 at the NAF Conference Centre, Abuja. This is our premier annual event bringing together ExJAM alumni from across the globe for three days of networking, celebration, and strategic planning for our association's future.",
        startDate: new Date("2025-11-28T09:00:00").toISOString(),
        endDate: new Date("2025-11-30T18:00:00").toISOString(),
        venue: "NAF Conference Centre",
        address: "Abuja, FCT, Nigeria",
        capacity: 500,
        price: 50000,
        earlyBirdPrice: 40000,
        earlyBirdDeadline: new Date("2025-10-31T23:59:59").toISOString(),
        imageUrl: null,
        status: "PUBLISHED",
        tags: ["Conference", "Annual Event", "Networking", "PG2025"],
        isRecurring: false,
        maxAttendees: 500,
      },
      {
        title: "AFMS/AFGMS Joint Passing Out Parade 2025",
        shortDescription: "Celebrating the graduation of the newest junior airmen and airwomen",
        description:
          "Join The ExJAM Association at the AFMS/AFGMS Joint Passing Out Parade 2025. This historic event celebrates the graduation of new junior airmen and airwomen. The week includes:\n\n• Wednesday, 23rd July: Speech and Prize Giving Day at Nsikak Eduok Hall\n• Friday, 25th July: Beating of the Retreat at AFMS Parade Ground\n• Saturday, 26th July: Passing Out Parade at AFMS Parade Ground\n• Saturday, 26th July: ExJAM AGM at Nsikak Eduok Hall",
        startDate: new Date("2025-07-23T09:00:00").toISOString(),
        endDate: new Date("2025-07-26T18:00:00").toISOString(),
        venue: "AFMS Parade Ground",
        address: "Air Force Military School, Jos, Plateau State",
        capacity: 1000,
        price: 25000,
        earlyBirdPrice: 20000,
        earlyBirdDeadline: new Date("2025-06-30T23:59:59").toISOString(),
        imageUrl: null,
        status: "PUBLISHED",
        tags: ["Passing Out Parade", "AFMS", "Jos", "AGM", "Graduation"],
        isRecurring: false,
        maxAttendees: 1000,
      },
    ];

    // Insert new events
    const { data, error } = await supabase.from("Event").insert(events).select();

    if (error) {
      console.error("Error creating events:", error);
      return;
    }

    console.log("✅ Successfully created events:");
    if (data) {
      data.forEach((event) => {
        console.log(`  - ${event.title}`);
        console.log(
          `    Date: ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`
        );
        console.log(`    Venue: ${event.venue}`);
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

createParadeEvents();
