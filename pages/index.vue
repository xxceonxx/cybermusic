<template>
  <v-container fluid>
    <v-row>
      <v-col cols="7" md="7" sm="12">
        <v-col>
          <h1 class="white--text pt-3 text-center">Cyber Music Workbench</h1>
          <h2 class="white--text text-center">
            Create Music with people around the world!
          </h2>
    
        </v-col>
        <h2 class="green--text text-center">Choose your instruments</h2>
        <v-col class="pa-16"><SlotMachineChooseInstrument /></v-col>
      </v-col>
      <v-col cols="5" md="5" sm="12" class="pt-6">
        <SlotMachine contain />
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
</style>