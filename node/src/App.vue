<template>
 <div>
   {{ title }}
 </div>
</template>
<script>
  import {reactive, toRefs} from "vue";
  export default {
    setup() {
      const state = reactive({
        count: 0,
        title: "hello, justin"
      })
      return {
        ...toRefs(state),
      }
    }
  }

</script>
