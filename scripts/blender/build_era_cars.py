"""
F1 // ARCHIVE — Parametric 5-Era Chassis Generator Pipeline
Generates 5 distinct procedural CAD-accurate F1 chassis spanning 1950 to 2026.
Standard coordinate alignment:
  Length along X (Nose = +X, Tail = -X)
  Height along Z in Blender (+Y in glTF)
  Width along Y in Blender (+Z in glTF)
  Tires grounded at Z = 0.0 (Y = 0.0 in glTF)

Compatible with Blender 5.3.0 and glTF 2.0 export.
"""

import math
import os
from pathlib import Path
import bpy

EXPORT_DIR = Path("C:/Users/parth/OneDrive/Desktop/personal projects/f1 project/assets/blender/exports")

CANONICAL_MATERIAL_ZONES = [
    ("body_primary", (0.85, 0.05, 0.05, 1.0), 0.16, 0.78),
    ("body_accent", (0.95, 0.95, 0.95, 1.0), 0.20, 0.80),
    ("carbon_exposed", (0.05, 0.06, 0.08, 1.0), 0.65, 0.18),
    ("front_wing", (0.85, 0.05, 0.05, 1.0), 0.20, 0.65),
    ("rear_wing", (0.95, 0.95, 0.95, 1.0), 0.20, 0.70),
    ("halo", (0.16, 0.18, 0.22, 1.0), 0.32, 0.90),
    ("tire_sidewall", (0.08, 0.09, 0.10, 1.0), 0.88, 0.04),
    ("brake_disc", (0.22, 0.24, 0.27, 1.0), 0.62, 0.65),
    ("cockpit", (0.07, 0.08, 0.10, 1.0), 0.78, 0.15),
]


def ensure_materials():
    """Create or retrieve all 9 canonical PBR material slots."""
    materials = {}
    for name, base_color, roughness, metalness in CANONICAL_MATERIAL_ZONES:
        mat = bpy.data.materials.get(name)
        if not mat:
            mat = bpy.data.materials.new(name=name)
            mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            # Set Base Color
            if "Base Color" in bsdf.inputs:
                bsdf.inputs["Base Color"].default_value = base_color
            # Set Roughness
            if "Roughness" in bsdf.inputs:
                bsdf.inputs["Roughness"].default_value = roughness
            # Set Metallic
            if "Metallic" in bsdf.inputs:
                bsdf.inputs["Metallic"].default_value = metalness
        materials[name] = mat
    return materials


def clear_scene():
    """Removes all objects, meshes, and orphan data."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def assign_material(obj, mat):
    """Assigns material to object's first material slot."""
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_wheel(materials, name, x, y, radius, width, is_rear=False):
    """Adds a grounded wheel with tire sidewall and brake disc assembly."""
    # Cylinder along Y axis (width is thickness)
    z = radius
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=width,
        rotation=(math.pi / 2, 0, 0),
        location=(x, y, z),
    )
    wheel = bpy.context.active_object
    wheel.name = f"{name}_tire"
    assign_material(wheel, materials["tire_sidewall"])

    # Inner brake disc
    inner_y = y - (width * 0.3 if y > 0 else -width * 0.3)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius * 0.52,
        depth=width * 0.25,
        rotation=(math.pi / 2, 0, 0),
        location=(x, inner_y, z),
    )
    disc = bpy.context.active_object
    disc.name = f"{name}_disc"
    assign_material(disc, materials["brake_disc"])

    return [wheel, disc]


def add_halo_cell(materials, name, x_center, z_base):
    """Adds Grade 5 titanium Halo safety cell around cockpit."""
    # Front center pillar
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.032,
        depth=0.34,
        rotation=(0, -math.radians(22), 0),
        location=(x_center + 0.38, 0, z_base + 0.20),
    )
    pillar = bpy.context.active_object
    pillar.name = f"{name}_pillar"
    assign_material(pillar, materials["halo"])

    # Main protective loop
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.28,
        minor_radius=0.034,
        location=(x_center + 0.12, 0, z_base + 0.36),
        rotation=(0, math.radians(12), 0),
    )
    loop = bpy.context.active_object
    loop.scale = (1.25, 0.95, 0.5)
    loop.name = f"{name}_loop"
    assign_material(loop, materials["halo"])

    return [pillar, loop]


def export_model(filename):
    """Exports all current scene objects to glTF / GLB in EXPORT_DIR."""
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = EXPORT_DIR / filename
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(out_path).replace("\\", "/"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )
    print(f"Exported: {out_path} ({os.path.getsize(out_path)} bytes)")


# ==============================================================================
# ERA 1: 1950s Front-Engine Grand Prix Era (Maserati 250F / Mercedes W196)
# ==============================================================================
def build_1950s():
    clear_scene()
    mats = ensure_materials()

    # 1. Streamlined cigar fuselage monocoque
    # Length: 4.25m, Width: 0.85m, Height: 0.70m, Grounded at Z=0.45
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.38,
        depth=3.90,
        rotation=(0, math.pi / 2, 0),
        location=(-0.35, 0, 0.44),
    )
    body = bpy.context.active_object
    body.name = "chassis_cigar_body"
    body.scale = (0.95, 1.0, 0.75)
    assign_material(body, mats["body_primary"])

    # Nosecone rounded tip
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.36,
        location=(1.60, 0, 0.42),
    )
    nose = bpy.context.active_object
    nose.name = "chassis_nose_cap"
    nose.scale = (1.2, 0.85, 0.7)
    assign_material(nose, mats["body_accent"])

    # Front oval radiator grille
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.26,
        depth=0.08,
        rotation=(0, math.pi / 2, 0),
        location=(1.95, 0, 0.41),
    )
    grille = bpy.context.active_object
    grille.name = "radiator_grille_open"
    grille.scale = (1.0, 0.8, 0.65)
    assign_material(grille, mats["brake_disc"])

    # Headrest fairing tapering back
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.28,
        radius2=0.05,
        depth=1.60,
        rotation=(0, -math.pi / 2, 0),
        location=(-1.15, 0, 0.58),
    )
    headrest = bpy.context.active_object
    headrest.name = "headrest_fairing"
    headrest.scale = (1.0, 0.75, 0.65)
    assign_material(headrest, mats["body_primary"])

    # Cockpit cutout & leather bucket seat
    bpy.ops.mesh.primitive_cube_add(
        size=0.60,
        location=(-0.15, 0, 0.50),
    )
    cockpit = bpy.context.active_object
    cockpit.name = "cockpit_tub"
    cockpit.scale = (0.85, 0.58, 0.45)
    assign_material(cockpit, mats["cockpit"])

    # Vintage 3-spoke wood steering wheel
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.18,
        minor_radius=0.022,
        location=(0.10, 0, 0.62),
        rotation=(0, math.radians(25), 0),
    )
    wheel_rim = bpy.context.active_object
    wheel_rim.name = "cockpit_steering_wheel"
    assign_material(wheel_rim, mats["cockpit"])

    # External side exhaust pipes (classic right flank bundle)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.045,
        depth=2.40,
        rotation=(0, math.pi / 2, 0),
        location=(-0.25, 0.42, 0.36),
    )
    exhaust = bpy.context.active_object
    exhaust.name = "side_exhaust_manifold"
    assign_material(exhaust, mats["brake_disc"])

    # 4 Narrow 16" Wire-Spoke/Steel Wheels
    # Wheelbase: 2.28m (Front X=+0.85, Rear X=-1.43), Track width: 1.35m (Y=±0.68), Radius: 0.38m
    r = 0.38
    w = 0.17
    add_wheel(mats, "wheel_fl", 0.85, 0.68, r, w)
    add_wheel(mats, "wheel_fr", 0.85, -0.68, r, w)
    add_wheel(mats, "wheel_rl", -1.43, 0.68, r, w * 1.15, is_rear=True)
    add_wheel(mats, "wheel_rr", -1.43, -0.68, r, w * 1.15, is_rear=True)

    export_model("1950s_front_engine_raw.glb")


# ==============================================================================
# ERA 2: 1988 Turbo Era (McLaren MP4/4 / Ferrari F1/87)
# ==============================================================================
def build_1988():
    clear_scene()
    mats = ensure_materials()

    # 1. Flat bottom undertray
    # Length: 4.35m, Width: 1.40m, Z=0.06
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-0.30, 0, 0.08),
    )
    floor = bpy.context.active_object
    floor.name = "chassis_flat_floor"
    floor.scale = (4.30, 1.40, 0.05)
    assign_material(floor, mats["carbon_exposed"])

    # 2. Main monocoque & nosecone
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.40, 0, 0.34),
    )
    mono = bpy.context.active_object
    mono.name = "chassis_monocoque"
    mono.scale = (2.60, 0.68, 0.46)
    assign_material(mono, mats["body_primary"])

    # Dropped wedge nose
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.35,
        radius2=0.10,
        depth=1.35,
        rotation=(0, math.pi / 2, 0),
        location=(1.95, 0, 0.26),
    )
    nose = bpy.context.active_object
    nose.name = "chassis_wedge_nose"
    nose.scale = (1.0, 0.65, 0.42)
    assign_material(nose, mats["body_primary"])

    # 3. Wide boxy turbo sidepods
    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-0.45, sign * 0.68, 0.28),
        )
        pod = bpy.context.active_object
        pod.name = f"sidepod_{side}"
        pod.scale = (1.90, 0.48, 0.34)
        assign_material(pod, mats["body_primary"])

        # Turbo intercooler inlet duct
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(0.48, sign * 0.68, 0.30),
        )
        inlet = bpy.context.active_object
        inlet.name = f"turbo_inlet_{side}"
        inlet.scale = (0.12, 0.40, 0.26)
        assign_material(inlet, mats["body_accent"])

    # 4. Wide boxy front wing
    # Mainplane
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(2.25, 0, 0.14),
    )
    fw = bpy.context.active_object
    fw.name = "front_wing_mainplane"
    fw.scale = (0.42, 1.55, 0.04)
    assign_material(fw, mats["front_wing"])

    # Endplates
    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(2.25, sign * 0.78, 0.22),
        )
        ep = bpy.context.active_object
        ep.name = f"front_wing_endplate_{side}"
        ep.scale = (0.50, 0.03, 0.22)
        assign_material(ep, mats["front_wing"])

    # 5. Massive twin-element boxy rear wing
    # Mainplane & upper flap
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-2.15, 0, 0.74),
    )
    rw = bpy.context.active_object
    rw.name = "rear_wing_mainplane"
    rw.scale = (0.52, 1.05, 0.06)
    assign_material(rw, mats["rear_wing"])

    # Tall vertical endplates
    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-2.15, sign * 0.53, 0.55),
        )
        rep = bpy.context.active_object
        rep.name = f"rear_wing_endplate_{side}"
        rep.scale = (0.68, 0.04, 0.68)
        assign_material(rep, mats["rear_wing"])

    # 6. Cockpit tub & roll hoop
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.10, 0, 0.44),
    )
    cockpit = bpy.context.active_object
    cockpit.name = "cockpit_interior"
    cockpit.scale = (0.75, 0.50, 0.38)
    assign_material(cockpit, mats["cockpit"])

    # Roll hoop triangular spar
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.04,
        depth=0.55,
        location=(-0.35, 0, 0.72),
    )
    rollhoop = bpy.context.active_object
    rollhoop.name = "chassis_roll_hoop"
    assign_material(rollhoop, mats["body_primary"])

    # 7. Wide 13" Turbo-Era Slicks
    # Front: 0.32m wide, Rear: 0.45m wide!
    r = 0.33
    add_wheel(mats, "wheel_fl", 1.25, 0.88, r, 0.32)
    add_wheel(mats, "wheel_fr", 1.25, -0.88, r, 0.32)
    add_wheel(mats, "wheel_rl", -1.55, 0.96, r, 0.44, is_rear=True)
    add_wheel(mats, "wheel_rr", -1.55, -0.96, r, 0.44, is_rear=True)

    export_model("1988_turbo_raw.glb")


# ==============================================================================
# ERA 3: 2004 V10 High-Downforce Pinnacle (Ferrari F2004 / Williams FW26)
# ==============================================================================
def build_2004():
    clear_scene()
    mats = ensure_materials()

    # 1. Stepped aerodynamic monocoque
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.35, 0, 0.36),
    )
    mono = bpy.context.active_object
    mono.name = "chassis_monocoque"
    mono.scale = (2.55, 0.62, 0.42)
    assign_material(mono, mats["body_primary"])

    # High sculpted droop nose
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.30,
        radius2=0.08,
        depth=1.55,
        rotation=(0, math.pi / 2, 0),
        location=(2.05, 0, 0.35),
    )
    nose = bpy.context.active_object
    nose.name = "chassis_droop_nose"
    nose.scale = (1.0, 0.55, 0.36)
    assign_material(nose, mats["body_primary"])

    # Engine cowl & airbox intake
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.18,
        depth=1.65,
        rotation=(0, math.pi / 2, 0),
        location=(-0.60, 0, 0.62),
    )
    airbox = bpy.context.active_object
    airbox.name = "engine_cowl_airbox"
    airbox.scale = (1.0, 0.65, 0.85)
    assign_material(airbox, mats["body_primary"])

    # 2. Sculpted sidepods with chimneys and flip-up winglets
    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-0.35, sign * 0.58, 0.28),
        )
        pod = bpy.context.active_object
        pod.name = f"sidepod_{side}"
        pod.scale = (1.85, 0.42, 0.32)
        assign_material(pod, mats["body_primary"])

        # Chimney cooling duct
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.05,
            depth=0.25,
            location=(-0.55, sign * 0.62, 0.48),
        )
        chimney = bpy.context.active_object
        chimney.name = f"cooling_chimney_{side}"
        assign_material(chimney, mats["body_accent"])

        # Flip-up winglet before rear tyre
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-1.15, sign * 0.68, 0.44),
        )
        flipup = bpy.context.active_object
        flipup.name = f"flipup_winglet_{side}"
        flipup.scale = (0.24, 0.22, 0.04)
        assign_material(flipup, mats["body_accent"])

    # 3. Multi-tier Front Wing & Endplates
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(2.30, 0, 0.16),
    )
    fw = bpy.context.active_object
    fw.name = "front_wing_cascade"
    fw.scale = (0.46, 1.40, 0.05)
    assign_material(fw, mats["front_wing"])

    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(2.30, sign * 0.70, 0.25),
        )
        fep = bpy.context.active_object
        fep.name = f"front_endplate_{side}"
        fep.scale = (0.55, 0.03, 0.24)
        assign_material(fep, mats["front_wing"])

    # 4. Narrow High Rear Wing & Beam Wing
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-2.10, 0, 0.78),
    )
    rw = bpy.context.active_object
    rw.name = "rear_wing_mainplane"
    rw.scale = (0.42, 0.98, 0.06)
    assign_material(rw, mats["rear_wing"])

    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-2.10, sign * 0.49, 0.58),
        )
        rep = bpy.context.active_object
        rep.name = f"rear_endplate_{side}"
        rep.scale = (0.60, 0.03, 0.52)
        assign_material(rep, mats["rear_wing"])

    # 5. Cockpit & Carbon undertray
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.10, 0, 0.42),
    )
    cockpit = bpy.context.active_object
    cockpit.name = "cockpit_interior"
    cockpit.scale = (0.70, 0.46, 0.34)
    assign_material(cockpit, mats["cockpit"])

    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-0.30, 0, 0.07),
    )
    floor = bpy.context.active_object
    floor.name = "chassis_undertray"
    floor.scale = (4.30, 1.30, 0.04)
    assign_material(floor, mats["carbon_exposed"])

    # 6. Grooved Tyres (4 grooves era)
    r = 0.33
    add_wheel(mats, "wheel_fl", 1.35, 0.78, r, 0.30)
    add_wheel(mats, "wheel_fr", 1.35, -0.78, r, 0.30)
    add_wheel(mats, "wheel_rl", -1.65, 0.82, r, 0.38, is_rear=True)
    add_wheel(mats, "wheel_rr", -1.65, -0.82, r, 0.38, is_rear=True)

    export_model("2004_v10_raw.glb")


# ==============================================================================
# ERA 4: 2024 Ground Effect Era (Red Bull RB20 / McLaren MCL38)
# ==============================================================================
def build_2024():
    clear_scene()
    mats = ensure_materials()

    # 1. Modern extended monocoque & long low nosecone
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.45, 0, 0.38),
    )
    mono = bpy.context.active_object
    mono.name = "chassis_monocoque"
    mono.scale = (2.85, 0.60, 0.40)
    assign_material(mono, mats["body_primary"])

    # Long low swept nosecone
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.28,
        radius2=0.06,
        depth=1.85,
        rotation=(0, math.pi / 2, 0),
        location=(2.40, 0, 0.28),
    )
    nose = bpy.context.active_object
    nose.name = "chassis_swept_nose"
    nose.scale = (1.0, 0.52, 0.32)
    assign_material(nose, mats["body_primary"])

    # 2. Venturi Underfloor & Floor Edge Wings
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-0.15, 0, 0.08),
    )
    floor = bpy.context.active_object
    floor.name = "chassis_venturi_floor"
    floor.scale = (4.80, 1.80, 0.05)
    assign_material(floor, mats["carbon_exposed"])

    # Diffuser kick-up at rear
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-2.15, 0, 0.20),
    )
    diffuser = bpy.context.active_object
    diffuser.name = "floor_diffuser_exit"
    diffuser.scale = (0.75, 1.10, 0.22)
    assign_material(diffuser, mats["carbon_exposed"])

    # 3. Downwash aerodynamic sidepods
    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-0.30, sign * 0.65, 0.32),
        )
        pod = bpy.context.active_object
        pod.name = f"sidepod_downwash_{side}"
        pod.scale = (2.20, 0.44, 0.36)
        assign_material(pod, mats["body_primary"])

        # Undercut intake mouth
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(0.75, sign * 0.65, 0.36),
        )
        mouth = bpy.context.active_object
        mouth.name = f"sidepod_inlet_{side}"
        mouth.scale = (0.22, 0.36, 0.24)
        assign_material(mouth, mats["body_accent"])

    # 4. Swept 4-Tier Front Wing & Endplates
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(2.70, 0, 0.16),
    )
    fw = bpy.context.active_object
    fw.name = "front_wing_swept"
    fw.scale = (0.55, 1.90, 0.05)
    assign_material(fw, mats["front_wing"])

    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(2.70, sign * 0.95, 0.28),
        )
        fep = bpy.context.active_object
        fep.name = f"front_wing_endplate_{side}"
        fep.scale = (0.65, 0.04, 0.26)
        assign_material(fep, mats["front_wing"])

    # 5. Curved Rear Wing & DRS Flap
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-2.45, 0, 0.82),
    )
    rw = bpy.context.active_object
    rw.name = "rear_wing_mainplane"
    rw.scale = (0.48, 1.35, 0.06)
    assign_material(rw, mats["rear_wing"])

    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-2.45, sign * 0.68, 0.62),
        )
        rep = bpy.context.active_object
        rep.name = f"rear_wing_endplate_{side}"
        rep.scale = (0.68, 0.04, 0.52)
        assign_material(rep, mats["rear_wing"])

    # 6. Halo Safety Cell & Cockpit
    add_halo_cell(mats, "halo_cell", 0.05, 0.38)

    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.15, 0, 0.40),
    )
    cockpit = bpy.context.active_object
    cockpit.name = "cockpit_interior"
    cockpit.scale = (0.75, 0.48, 0.32)
    assign_material(cockpit, mats["cockpit"])

    # 7. 18-inch Low-Profile Wheels & Wheel Deflectors
    r = 0.36
    add_wheel(mats, "wheel_fl", 1.70, 0.88, r, 0.30)
    add_wheel(mats, "wheel_fr", 1.70, -0.88, r, 0.30)
    add_wheel(mats, "wheel_rl", -1.85, 0.90, r, 0.40, is_rear=True)
    add_wheel(mats, "wheel_rr", -1.85, -0.90, r, 0.40, is_rear=True)

    export_model("2024_ground_effect_raw.glb")


# ==============================================================================
# ERA 5: 2026 Active Aerodynamics Concept
# ==============================================================================
def build_2026():
    clear_scene()
    mats = ensure_materials()

    # Nimble dimensions: -200mm wheelbase, -100mm width vs 2024
    # 1. Compact monocoque & tapered nosecone
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.40, 0, 0.38),
    )
    mono = bpy.context.active_object
    mono.name = "chassis_monocoque"
    mono.scale = (2.65, 0.56, 0.38)
    assign_material(mono, mats["body_primary"])

    bpy.ops.mesh.primitive_cone_add(
        radius1=0.26,
        radius2=0.05,
        depth=1.70,
        rotation=(0, math.pi / 2, 0),
        location=(2.25, 0, 0.28),
    )
    nose = bpy.context.active_object
    nose.name = "chassis_nimble_nose"
    nose.scale = (1.0, 0.48, 0.30)
    assign_material(nose, mats["body_primary"])

    # 2. Active Aerodynamics Front Wing & Dynamic Flap
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(2.50, 0, 0.15),
    )
    fw = bpy.context.active_object
    fw.name = "front_wing_mainplane"
    fw.scale = (0.42, 1.75, 0.05)
    assign_material(fw, mats["front_wing"])

    # ARTICULATING FRONT FLAP OBJECT (Named for animation tweening)
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(2.58, 0, 0.20),
    )
    fw_flap = bpy.context.active_object
    fw_flap.name = "front_wing_active_flap"
    fw_flap.scale = (0.24, 1.72, 0.03)
    assign_material(fw_flap, mats["front_wing"])

    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(2.50, sign * 0.88, 0.26),
        )
        fep = bpy.context.active_object
        fep.name = f"front_wing_endplate_{side}"
        fep.scale = (0.58, 0.04, 0.24)
        assign_material(fep, mats["front_wing"])

    # 3. Active Aerodynamics Rear Wing & Dynamic Flap
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-2.30, 0, 0.80),
    )
    rw = bpy.context.active_object
    rw.name = "rear_wing_mainplane"
    rw.scale = (0.44, 1.25, 0.06)
    assign_material(rw, mats["rear_wing"])

    # ARTICULATING REAR FLAP OBJECT (Named for animation tweening)
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-2.34, 0, 0.88),
    )
    rw_flap = bpy.context.active_object
    rw_flap.name = "rear_wing_active_flap"
    rw_flap.scale = (0.28, 1.22, 0.04)
    assign_material(rw_flap, mats["rear_wing"])

    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-2.30, sign * 0.63, 0.64),
        )
        rep = bpy.context.active_object
        rep.name = f"rear_wing_endplate_{side}"
        rep.scale = (0.64, 0.04, 0.48)
        assign_material(rep, mats["rear_wing"])

    # 4. Streamlined sidepods with inwash cooling
    for side, sign in [("left", 1), ("right", -1)]:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(-0.30, sign * 0.58, 0.32),
        )
        pod = bpy.context.active_object
        pod.name = f"sidepod_{side}"
        pod.scale = (2.05, 0.38, 0.34)
        assign_material(pod, mats["body_primary"])

        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(0.68, sign * 0.58, 0.35),
        )
        mouth = bpy.context.active_object
        mouth.name = f"sidepod_inlet_{side}"
        mouth.scale = (0.20, 0.30, 0.22)
        assign_material(mouth, mats["body_accent"])

    # 5. Flush floor & Halo safety cell
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-0.15, 0, 0.08),
    )
    floor = bpy.context.active_object
    floor.name = "chassis_flush_floor"
    floor.scale = (4.50, 1.65, 0.05)
    assign_material(floor, mats["carbon_exposed"])

    add_halo_cell(mats, "halo_cell", 0.05, 0.38)

    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.15, 0, 0.40),
    )
    cockpit = bpy.context.active_object
    cockpit.name = "cockpit_interior"
    cockpit.scale = (0.72, 0.45, 0.32)
    assign_material(cockpit, mats["cockpit"])

    # 6. Narrower 18" Wheels (-25mm front, -30mm rear)
    r = 0.36
    add_wheel(mats, "wheel_fl", 1.55, 0.82, r, 0.28)
    add_wheel(mats, "wheel_fr", 1.55, -0.82, r, 0.28)
    add_wheel(mats, "wheel_rl", -1.75, 0.85, r, 0.37, is_rear=True)
    add_wheel(mats, "wheel_rr", -1.75, -0.85, r, 0.37, is_rear=True)

    export_model("2026_active_aero_raw.glb")


def build_all():
    print("=== Generating 5 Era F1 Chassis via Blender (bpy) ===")
    build_1950s()
    build_1988()
    build_2004()
    build_2024()
    build_2026()
    print("=== All 5 Era Models Generated Successfully ===")


if __name__ == "__main__":
    build_all()
