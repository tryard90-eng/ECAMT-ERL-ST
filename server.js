const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let sira = [];
const MAKSIMUM_SIRA = 20;
let siraAcikMi = true; 
let siraMesajId = null; 
let siraKanalId = null;

// Sırayı yönetmeye yetkili olan Tester/Admin rol ID'leri
const yetkiliRoller = [
    '1504148852192706723',
    '1504149173677719696',
    '1504148961710047445',
    '1504149070040797224',
    '1504148812246024302',
    '1504148648689401886',
    '1504148708143661136',
    '1504148758001094926'
];

function siraMesajiOlustur() {
    const siraListesi = sira.length > 0 
        ? sira.map((id, index) => `${index + 1}. <@${id}>`).join('\n') 
        : 'Kimse yok.';

    const embed = new EmbedBuilder()
        .setColor(siraAcikMi ? '#ff4747' : '#555555') 
        .setAuthor({ name: 'Ecam Tierlist Queue Bot +1.9', iconURL: client.user?.displayAvatarURL() }) 
        .setTitle('Test Ol')
        .setDescription('Test olmak için aşağıdaki butonları kullanabilirsiniz!')
        .addFields(
            { name: 'Durum:', value: siraAcikMi ? '🟢 Sıra Açık' : '🔴 Sıra Kapalı ❌', inline: false },
            { name: `Sıradaki kişiler: (${sira.length}/${MAKSIMUM_SIRA})`, value: siraListesi, inline: false }
        )
        .setFooter({ text: 'Ecam Queue System' })
        .setTimestamp(); 

    const butonlar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sira_katil')
            .setLabel('Katıl')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!siraAcikMi), // Sıra kapalıysa buton kilitlenir

        new ButtonBuilder()
            .setCustomId('sira_cik')
            .setLabel('Sıradan Çık')
            .setStyle(ButtonStyle.Danger) 
    );

    return { embeds: [embed], components: [butonlar] };
}

async function mesajGuncelle(guild) {
    if (!siraKanalId || !siraMesajId) return;
    try {
        const kanal = await guild.channels.fetch(siraKanalId);
        const mesaj = await kanal.messages.fetch(siraMesajId);
        await mesaj.edit(siraMesajiOlustur());
    } catch (err) {
        console.log("Mesaj güncellenemedi.");
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const yetkiliMi = message.member.roles.cache.some(role => yetkiliRoller.includes(role.id));

    // 1. !sirabaşlat (Komut anında silinir)
    if (message.content === '!sirabaşlat') {
        if (!yetkiliMi) return yetkiHata(message);

        // İlk önce komut mesajını siler
        await message.delete().catch(() => null);

        const sayfa = siraMesajiOlustur();
        const gonderilenMesaj = await message.channel.send({
            content: `<@${message.author.id}> Sword Sırasını Açtı @everyone`,
            embeds: sayfa.embeds,
            components: sayfa.components
        });

        siraMesajId = gonderilenMesaj.id;
        siraKanalId = message.channel.id;
    }

    // 2. !sira ac
    if (message.content === '!sira ac') {
        if (!yetkiliMi) return yetkiHata(message);
        siraAcikMi = true;
        
        await message.delete().catch(() => null);
        await message.channel.send('🟢 Sıra testerlar tarafından başarıyla açıldı!').then(m => setTimeout(() => m.delete().catch(() => null), 3000));
        await mesajGuncelle(message.guild);
    }

    // 3. !sira kapa
    if (message.content === '!sira kapa') {
        if (!yetkiliMi) return yetkiHata(message);
        siraAcikMi = false;
        
        await message.delete().catch(() => null);
        await message.channel.send('🔴 Sıra yeni katılımlara kapatıldı.').then(m => setTimeout(() => m.delete().catch(() => null), 3000));
        await mesajGuncelle(message.guild);
    }

    // 4. !sira temizle
    if (message.content === '!sira temizle') {
        if (!yetkiliMi) return yetkiHata(message);
        sira = [];
        
        await message.delete().catch(() => null);
        await message.channel.send('🧹 Sıra tamamen temizlendi.').then(m => setTimeout(() => m.delete().catch(() => null), 3000));
        await mesajGuncelle(message.guild);
    }

    // 5. !sira at @kullanici
    if (message.content.startsWith('!sira at')) {
        if (!yetkiliMi) return yetkiHata(message);
        const hedef = message.mentions.members.first();
        if (!hedef) return message.reply('⚠️ Lütfen sıradan atmak istediğin kişiyi etiketle!').then(m => setTimeout(() => m.delete().catch(() => null), 4000));

        if (!sira.includes(hedef.id)) {
            return message.reply('👤 Bu kişi zaten sırada değil kanka.').then(m => setTimeout(() => m.delete().catch(() => null), 4000));
        }

        sira = sira.filter(id => id !== hedef.id);
        await message.delete().catch(() => null);
        await message.channel.send(`🚫 <@${hedef.id}> sıradan zorla çıkarıldı.`).then(m => setTimeout(() => m.delete().catch(() => null), 4000));
        await mesajGuncelle(message.guild);
    }

    // 6. !sira kanal ac @kullanici
    if (message.content.startsWith('!sira kanal ac')) {
        if (!yetkiliMi) return yetkiHata(message);
        const hedef = message.mentions.members.first();
        if (!hedef) return message.reply('⚠️ Kanala eklenecek üyeyi etiketlemelisin!').then(m => setTimeout(() => m.delete().catch(() => null), 4000));

        const izinler = [
            { id: message.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: hedef.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
        ];

        yetkiliRoller.forEach(rolId => {
            izinler.push({
                id: rolId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ManageChannels],
            });
        });

        const yaziKanali = await message.guild.channels.create({
            name: `📋-${hedef.user.username}-test`,
            type: ChannelType.GuildText,
            permissionOverwrites: izinler
        });

        const sesKanali = await message.guild.channels.create({
            name: `🔊 ${hedef.user.username} Test Odası`,
            type: ChannelType.GuildVoice,
            permissionOverwrites: izinler
        });

        await yaziKanali.send(`👋 Selam <@${hedef.id}>, test odan hazırlandı!\n🔊 Ses kanalı: <#${sesKanali.id}>`);
        await message.delete().catch(() => null);
        await message.channel.send(`✅ <@${hedef.id}> için özel test odaları açıldı! (<#${yaziKanali.id}>)`).then(m => setTimeout(() => m.delete().catch(() => null), 6000));
    }
});

function yetkiHata(message) {
    return message.reply('❌ Bu komutu kullanmak için yetkin yok kanka!')
        .then(msg => setTimeout(() => msg.delete().catch(() => null), 4000));
}

// Buton Etkileşimleri
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const userId = interaction.user.id;

    if (interaction.customId === 'sira_katil') {
        if (!siraAcikMi) return interaction.reply({ content: '❌ Üzgünüm, sıra şu anda kapalı.', ephemeral: true });
        if (sira.includes(userId)) return interaction.reply({ content: '⚠️ Zaten sıradadasın kanka!', ephemeral: true });
        if (sira.length >= MAKSIMUM_SIRA) return interaction.reply({ content: '🚫 Sıra tamamen dolu!', ephemeral: true });

        sira.push(userId);
        await interaction.update(siraMesajiOlustur());
    }

    if (interaction.customId === 'sira_cik') {
        if (!sira.includes(userId)) return interaction.reply({ content: '⚠️ Zaten sırada değilsin.', ephemeral: true });

        sira = sira.filter(id => id !== userId);
        await interaction.update(siraMesajiOlustur());
    }
});

client.login('MTUwNTI0NTQxMTc2MDQwNjU0OA.GX_B54.8MNc3L4lyB3y96Hg_SYCS2VYf5soSo4RIBnhI0');
