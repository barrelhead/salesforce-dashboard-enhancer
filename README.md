# Neunelfer Atlas

An interactive, configurator-style reference for the Porsche 911 from 1990 to today
(964, 993, 996, 997, 991 and 992, including the facelift phases).

Pick a generation and a model and the car is redrawn in side, front and rear view,
all at one scale. Because every drawing is generated from numeric geometry, switching
models morphs one shape into the next, so the differences are easy to see. You can
also pin a car and keep it on screen as a dashed outline while you browse the others.

## What you can change

- Generation, facelift phase and model (about 90 variants)
- Body style: Coupé, Cabriolet, Targa, Speedster, with the roof open or closed
- Period paint palette per generation, plus model-only colours
- Period wheel designs, brake caliper colours, hood and interior colours
- Rear aero: retracting spoiler up or down, Aerokit, ducktail, fixed wings
- Side script, window trim and the Dakar Rallye Design livery where offered

## Run it

Open `index.html` in a browser. There is no server and no dependency to install.

## Edit it

Sources live in `src/`; `node build.js` inlines them into `index.html`.

| File | Contents |
| --- | --- |
| `src/data.js` | Generations, models, paints, wheels, aero definitions |
| `src/car.js` | The parametric SVG drawing engine (side, front, rear, wheels) |
| `src/app.js` | State, option panel, tweening between models, compare |
| `src/styles.css`, `src/body.html` | Layout and theme |

## Accuracy

This is an unofficial enthusiast project, not affiliated with or endorsed by Porsche AG.
The drawings are schematic. Paint swatches are screen approximations, and power and
dimension figures are rounded brochure values written from memory, so check them
before relying on them. Paint-to-sample colours and some limited editions are not listed.
