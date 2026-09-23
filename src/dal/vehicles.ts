import * as v from "valibot";
import { categoryApi, type Resource } from "./swapi";

const vehicleSchema = v.object({
  name: v.string(),
  model: v.string(),
  manufacturer: v.string(),
  cost_in_credits: v.string(),
  length: v.string(),
  max_atmosphering_speed: v.string(),
  crew: v.string(),
  passengers: v.string(),
  cargo_capacity: v.string(),
  consumables: v.string(),
  vehicle_class: v.string(),
  pilots: v.array(v.string()),
  films: v.array(v.string()),
  created: v.string(),
  edited: v.string(),
  url: v.string(),
});

export type Vehicle = v.InferOutput<typeof vehicleSchema> & Resource;

export function isVehicle(value: unknown): value is Vehicle {
  return v.is(vehicleSchema, value);
}

export function blankVehicle(url: string): Vehicle {
  return {
    name: "",
    model: "",
    manufacturer: "",
    cost_in_credits: "",
    length: "",
    max_atmosphering_speed: "",
    crew: "",
    passengers: "",
    cargo_capacity: "",
    consumables: "",
    vehicle_class: "",
    pilots: [],
    films: [],
    created: new Date().toISOString(),
    edited: new Date().toISOString(),
    url,
  };
}

export const vehiclesApi = categoryApi<Vehicle>(
  "vehicles",
  blankVehicle,
  (vehicle) => vehicle.name,
  isVehicle,
);