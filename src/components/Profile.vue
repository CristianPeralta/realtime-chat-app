<template>
  <section class="section">
    <div class="container">
      <h3 class="title">Profile</h3>
      <p v-if="user.username"><strong>{{ user.username }}</strong></p>
      <p v-if="user.email">{{ user.email }}</p>
      <router-link to="/room/home">Back to chat</router-link>
    </div>
  </section>
</template>

<script>
import ChatServices from '@/services/ChatServices'

export default {
  name: 'Profile',
  data () {
    return { user: {} }
  },
  created () {
    ChatServices.user().then((response) => {
      this.user = response.data || {}
    })
  }
}
</script>
