const { Testimonial } = require('../models');

const testimonials = [
  {
    text: "Wow! I can really notice the quality of the tools. I really like how they are made and see how they can help patients avoid emergency visits.",
    by: "Dr Marc Lemchen, Lemchen Salzer Orthodontics"
  },
  {
    text: "Tweakz is a genius product. It is going to change the way patients manage their oral care once they leave the office.",
    by: "Dr Jamie Reynolds, Orthodontic Partners, OrthoFi and Reynolds Orthodontics"
  },
  {
    text: "I think the Tweakz for Braces is genius, particularly the distal end cutters.",
    by: "Queens Gate Orthodontics UK"
  },
  {
    text: "Tweakz is better than the instruments we use in the office. My whole team loves them and thinks every new patient should have one!",
    by: "Dr David Sarver, Sarver Orthodontics"
  },
  {
    text: "We have really enjoyed Tweakz. Our parents are so thankful when we show and explain how to use the tool. They are very appreciative of the kit knowing they have comfort in possibly not having to check their child out of school when they may have a wire poke and can easily fix it. We love being able to offer these kits to our patients in their welcome bag! Thanks so much for such a great product!",
    by: "Quest Pediatric Dentistry"
  },
  {
    text: "I got a call last night at 10pm from a patient with a broken wire. We were unable to cut it over the phone with nail clippers, so he had to suffer through the night and first thing the next morning we had them come in and try OrthoNu. They loved the product and wished they had it last night.",
    by: "Dr Ashley Kissling, SOCO Pediatric Dentistry and Orthodontic Care"
  },
  {
    text: "Tweakz is an awesome product for patients to have in case of an emergency. I wouldn’t be surprised if one day every orthodontic start bag had a Tweakz!",
    by: "Dr Luke Shapiro, Wall Street Orthodontics"
  },
  {
    text: "Tweakz has been great for our patients who travel.",
    by: "Brightside Braces"
  },
  {
    text: "Tweakz for braces has been really helpful for our patients dealing with pokey wires.",
    by: "Milnor Orthodontics"
  },
  {
    text: "Tweakz for Braces has been really helpful for emergencies. And our adult aligner patients really like the removal tool on the Tweakz for Aligners.",
    by: "Grosso Orthodontics"
  },
  {
    text: "Tweakz for Braces have been really helpful for those weekend emergencies.",
    by: "Happy Smiles Orthodontics"
  },
  {
    text: "We have enjoyed having the Tweakz available to give to our patients. We have one office in particular that is farther away and we tend to give more of them out in that office than our other two, just because we are not as available for emergencies. We also use Dental Monitoring and find it very helpful for our patients to have the Tweakz who are using – if they have a problem we can get a scan of their teeth and them walk them through how to clip a wire or trim their aligners etc. We have given a lot out to our older population who are doing aligners to help them take them in and out, and to file down any sharp edges. This year we are taking goody bags to our school nurses in the area, during dental health month – with a mouth mirror and other things to show them how to help in a “braces emergency” so the child doesnt have to be taken out of school. We are going to take some Tweakz for Braces to them as well in case it will help them to clip a wire.",
    by: "Grosso Orthodontics"
  }
];

async function seedTestimonials() {
  try {
    for (const t of testimonials) {
      await Testimonial.findOrCreate({
        where: { text: t.text },
        defaults: t
      });
    }
    console.log('Testimonials seeded successfully.');
  } catch (err) {
    console.error('Error seeding testimonials:', err);
  }
}

module.exports = seedTestimonials;
