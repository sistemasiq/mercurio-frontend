<template>
  <!--
    Layout del visor de padres.
    A diferencia de AuthLayout (que fija el contenedor a la altura del
    viewport con overflow hidden para la pantalla de login), este layout
    permite el flujo natural del scroll vertical: el contenedor crece con
    el contenido y el documento se desplaza.
  -->
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
