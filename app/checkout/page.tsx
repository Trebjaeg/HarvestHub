"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import LoadingDots from '@/components/ui/LoadingDots';
import { calculateDeliveryFees, getDeliveryFee, isDeliveryAvailable, VEHICLE_OPTIONS, getVehicleConfig } from '@/lib/delivery-calculator';

// Philippine provinces and cities data
const PROVINCE_CITIES: Record<string, string[]> = {
  'Metro Manila': [
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong', 
    'Pasay', 'Caloocan', 'Marikina', 'San Juan', 'Muntinlupa', 'Parañaque', 
    'Las Piñas', 'Valenzuela', 'Malabon', 'Navotas', 'Pateros'
  ],
  'Rizal': [
    'Antipolo', 'Cainta', 'Taytay', 'Angono', 'Binangonan', 'Rodriguez', 
    'San Mateo', 'Tanay', 'Teresa', 'Morong', 'Baras', 'Cardona', 'Jalajala', 'Pililla'
  ],
  'Cavite': [
    'Bacoor', 'Imus', 'Dasmariñas', 'Cavite City', 'General Trias', 
    'Rosario', 'Silang', 'Carmona', 'General Mariano Alvarez', 'Trece Martires'
  ],
  'Laguna': [
    'Calamba', 'Santa Rosa', 'Biñan', 'San Pedro', 'Los Baños', 'Cabuyao', 
    'San Pablo', 'Sta. Cruz', 'Pagsanjan', 'Liliw'
  ],
  'Bulacan': [
    'Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue', 
    'Balagtas', 'Guiguinto', 'Pandi', 'Santa Maria', 'Obando'
  ],
  'Pampanga': [
    'San Fernando', 'Angeles', 'Mabalacat', 'Apalit', 'Macabebe', 'Masantol', 
    'Mexico', 'Santa Rita', 'Guagua', 'Lubao'
  ]
};

// Barangays data for cities (same as AddressManager)
const CITY_BARANGAYS: Record<string, string[]> = {
  // Metro Manila
  'Quezon City': [
    'Bagong Pag-asa', 'Bahay Toro', 'Balingasa', 'Bungad', 'Damar', 'Del Monte', 
    'Diliman', 'Don Manuel', 'Duyan-Duyan', 'E. Rodriguez', 'Escuela', 'Fairview', 
    'Greater Lagro', 'Gulod', 'Holy Spirit', 'Kaligayahan', 'Kamuning', 'Katipunan', 
    'Kaunlaran', 'La Loma', 'Libis', 'Lourdes', 'Loyola Heights', 'Maharlika', 
    'Malaya', 'Marilag', 'Masambong', 'Matandang Balara', 'Milagrosa', 'N.S. Amoranto', 
    'Nagkaisang Nayon', 'Nayong Kanluran', 'New Era', 'North Fairview', 'Novaliches Proper', 
    'Obrero', 'Old Balara', 'Paang Bundok', 'Pag-ibig sa Nayon', 'Pagkakaisa', 
    'Paligsahan', 'Paltok', 'Paraiso', 'Phil-Am', 'Pinagkaisahan', 'Poblacion', 
    'Project 6', 'Project 7', 'Project 8', 'Roxas', 'Sacred Heart', 'San Agustin', 
    'San Antonio', 'San Bartolome', 'San Isidro Labrador', 'San Jose', 'San Martin de Porres', 
    'San Roque', 'Santa Cruz', 'Santa Lucia', 'Santa Monica', 'Santa Teresita', 
    'Santo Cristo', 'Santo Domingo', 'Santo Niño', 'Siena', 'Silangan', 'Socorro', 
    'Tagumpay', 'Talayan', 'Tandang Sora', 'Teacher\'s Village East', 'Teacher\'s Village West', 
    'Tigbe', 'Ugong Norte', 'Unang Sigaw', 'UP Campus', 'Valencia', 'Vasra', 
    'Veterans Village', 'Villa Maria Clara', 'Violago Homes', 'West Triangle'
  ],
  'Manila': [
    'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 
    'Quiapo', 'Sampaloc', 'San Andres', 'San Miguel', 'San Nicolas', 'Santa Ana', 
    'Santa Cruz', 'Santa Mesa', 'Tondo'
  ],
  'Makati': [
    'Bangkal', 'Bel-Air', 'Carmona', 'Cembo', 'Comembo', 'Dasmariñas', 'East Rembo', 
    'Forbes Park', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Kasilawan', 'La Paz', 
    'Magallanes', 'Olympia', 'Palanan', 'Pembo', 'Pinagkaisahan', 'Pio del Pilar', 
    'Poblacion', 'Post Proper Northside', 'Post Proper Southside', 'Rizal', 
    'San Antonio', 'San Isidro', 'San Lorenzo', 'Santa Cruz', 'Singkamas', 
    'South Cembo', 'Tejeros', 'Urdaneta', 'Valenzuela', 'West Rembo'
  ],
  'Pasig': [
    'Bagong Ilog', 'Bagong Katipunan', 'Bambang', 'Buting', 'Caniogan', 'Dela Paz', 
    'Kalawaan', 'Kapasigan', 'Kapitolyo', 'Malinao', 'Manggahan', 'Maybunga', 
    'Oranbo', 'Palatiw', 'Pinagbuhatan', 'Pineda', 'Rosario', 'Sagad', 'San Antonio', 
    'San Joaquin', 'San Jose', 'San Miguel', 'San Nicolas', 'Santa Cruz', 'Santa Lucia', 
    'Santa Rosa', 'Santo Tomas', 'Santolan', 'Sumilang', 'Ugong'
  ],
  'Las Piñas': [
    'Almanza Dos', 'Almanza Uno', 'B.F. International Village', 'Daang Hari', 'Daniel Fajardo', 
    'Elias Aldana', 'Ilaya', 'Manuyo Dos', 'Manuyo Uno', 'Pamplona Dos', 'Pamplona Tres', 
    'Pamplona Uno', 'Pilar', 'Poblacion', 'Pulang Lupa Dos', 'Pulang Lupa Uno', 'Talon Dos', 
    'Talon Kuatro', 'Talon Singko', 'Talon Tres', 'Talon Uno', 'Zapote'
  ],
  
  // Bulacan
  'Malolos': [
    'Anilao', 'Atlag', 'Babatnin', 'Bagna', 'Bagong Bayan', 'Balayong', 'Balite', 
    'Bangkal', 'Barihan', 'Bulihan', 'Bungahan', 'Caingin', 'Calero', 'Canalate', 
    'Cansanay', 'Guinhawa', 'Liang', 'Ligas', 'Longos', 'Look 1st', 'Look 2nd', 
    'Lugam', 'Mabolo', 'Masile', 'Matimbo', 'Mojon', 'Namayan', 'Niugan', 'Pamarawan', 
    'Panasahan', 'Pinagbakahan', 'San Agustin', 'San Gabriel', 'San Juan', 'San Pablo', 
    'San Vicente', 'Santiago', 'Santisima Trinidad', 'Santo Cristo', 'Santo Niño', 
    'Sumapang Bata', 'Sumapang Matanda', 'Taal', 'Tikay'
  ],
  'Santa Maria': [
    'Bagbaguin', 'Balasing', 'Buenavista', 'Camangyanan', 'Catmon', 'Cay Pombo', 
    'Caysio', 'Guyong', 'Lalakhan', 'Mag-asawang Sapa', 'Mahabang Parang', 'Parada', 
    'Poblacion', 'Pulong Buhangin', 'San Gabriel', 'San Jose Patag', 'Santa Clara', 
    'Santa Cruz', 'Santo Tomas', 'Silangan', 'Tabing Bakod', 'Tumana'
  ],
  'San Jose del Monte': [
  'Assumption', 'Bagong Buhay I', 'Bagong Buhay II', 'Bagong Buhay III', 'Citrus', 
  'Ciudad Real', 'Dulong Bayan', 'Fatima', 'Fatima II', 'Fatima III', 'Fatima IV', 
  'Fatima V', 'Francisco Homes – Guijo', 'Francisco Homes – Mulawin', 'Francisco Homes – Narra', 
  'Francisco Homes – Yakal', 'Gaya-Gaya', 'Graceville', 'Gumaoc Central', 'Gumaoc East', 
  'Gumaoc West', 'Kaybanban', 'Kaypian', 'Lawang Pari', 'Maharlika', 'Minuyan', 
  'Minuyan II', 'Minuyan III', 'Minuyan IV', 'Minuyan Proper', 'Minuyan V', 'Muzon East', 
  'Muzon Proper', 'Muzon South', 'Muzon West', 'Paradise III', 'Poblacion', 'Poblacion I', 
  'Saint Martin de Porres', 'San Isidro', 'San Manuel', 'San Martin I', 'San Martin II', 
  'San Martin III', 'San Martin IV', 'San Pedro', 'San Rafael I', 'San Rafael II', 
  'San Rafael III', 'San Rafael IV', 'San Rafael V', 'San Roque', 'Santa Cruz I', 
  'Santa Cruz II', 'Santa Cruz III', 'Santa Cruz IV', 'Santa Cruz V', 'Santo Cristo', 
  'Santo Niño I', 'Santo Niño II', 'Sapang Palay', 'Tungkong Mangga'
  ],
  'Meycauayan': [
    'Bagbaguin', 'Bahay Pare', 'Bancal', 'Banga', 'Bayugo', 'Camalig', 'Calvario', 
    'Hatol', 'Iba', 'Langka', 'Lawa', 'Libtong', 'Liputan', 'Longos', 'Malhacan', 
    'Pandayan', 'Pantoc', 'Perez', 'Poblacion', 'Saint Francis', 'Saluysoy', 'Tugatog', 
    'Ubihan', 'Zamora'
  ],
  'Marilao': [
    'Abangan Norte', 'Abangan Sur', 'Bancal', 'Ibayo', 'Lambakin', 'Lias', 'Loma de Gato', 
    'Patubig', 'Poblacion', 'Prenza I', 'Prenza II', 'Saog', 'Santa Rosa I', 'Santa Rosa II', 
    'Tabing Ilog'
  ],
  'Bocaue': [
    'Antipona', 'Bagumbayan', 'Bambang', 'Batia', 'Biñang I', 'Biñang II', 'Bolacan', 
    'Bundukan', 'Bunlo', 'Caingin', 'Duhat', 'Igulot', 'Lolomboy', 'Poblacion', 
    'Sulucan', 'Tambobong', 'Turo', 'Wakas'
  ],
  'Balagtas': [
    'Borol I', 'Borol II', 'Dalig', 'Longos', 'Panginay', 'Pulong Gubat', 
    'San Juan', 'Santol', 'Wawa'
  ],
  'Guiguinto': [
    'Cutcut', 'Daungan', 'Ilang-Ilang', 'Malis', 'Panginay', 'Poblacion', 
    'Pritil', 'Pulong Gubat', 'Santa Cruz', 'Santa Rita', 'Tabang', 'Tabe', 'Tuktukan'
  ],
  'Pandi': [
    'Bagbaguin', 'Bagong Barrio', 'Baka-Bakahan', 'Bunsuran I', 'Bunsuran II', 'Bunsuran III', 
    'Cacarong Bata', 'Cacarong Matanda', 'Cupang', 'Malibo', 'Manatal', 'Mapulang Lupa', 
    'Masagana', 'Masuso', 'Pinagkuartelan', 'Poblacion', 'Real de Cacarong', 'San Roque', 
    'Santo Niño', 'Siling Bata', 'Siling Matanda'
  ],
  'Obando': [
    'Binuangan', 'Hulo', 'Lawa', 'Paco', 'Paliwas', 'Panghulo', 'Poblacion', 
    'San Pascual', 'Salambao', 'Tawiran'
  ],
  
  // Rizal
  'Antipolo': [
    'Bagong Nayon', 'Beverly Hills', 'Cupang', 'Dalig', 'dela Paz', 'Fort Bonifacio', 
    'Generoso', 'Inarawan', 'Izaak Walton', 'Muntindilaw', 'Olandes', 'Pag-ibig', 
    'Poblacion', 'San Isidro', 'San Jose', 'San Juan', 'San Luis', 'San Roque', 
    'Santa Cruz', 'Santo Niño', 'Taktak', 'Tugos'
  ],
  'Cainta': [
    'Dayap', 'dela Paz', 'Kasunduan', 'Marikina Heights', 'Poblacion', 'San Agustin', 
    'San Andres', 'San Isidro', 'San Juan', 'Santo Domingo', 'Santo Niño'
  ],
  'Taytay': [
    'Bagumbayan', 'Baybayin', 'Dalig', 'dela Paz', 'Dolores', 'Kinabutasan', 'Matatalaib', 
    'Muzon', 'Poblacion', 'San Isidro', 'San Juan', 'Santa Ana'
  ],
  'Angono': [
    'Bagumbayan', 'Mahabang Parang', 'Poblacion', 'San Isidro', 'San Pedro', 'San Roque'
  ],
  'Binangonan': [
    'Bagong Silangan', 'Bombongan', 'Calumpang', 'Darangan', 'Itlog', 'Janosa', 'Kinabutasan', 
    'Libid', 'Libis', 'Mahabang Parang', 'Malakaban', 'Poblacion', 'Pag-asa', 'Patiis', 
    'Pintong Bukawe', 'Pintong Gubat', 'San Carlos', 'San Isidro', 'Tatala', 'Tayuman'
  ],
  'Rodriguez': [
    'Burgos', 'Geronimo', 'Macabud', 'Manggahan', 'Montalban Proper', 'Mountain View', 
    'Poblacion', 'San Isidro', 'San Jose', 'San Rafael'
  ],
  'San Mateo': [
    'Ampid I', 'Ampid II', 'Banaba', 'Dulongbayan', 'Guitnang Bayan I', 'Guitnang Bayan II', 
    'Malanday', 'Maly', 'Nangka', 'Poblacion'
  ],
  'Tanay': [
    'Cayabu', 'Cayuyong', 'Daraitan', 'Katipunan', 'Laiban', 'Mag-ampon', 'Mamuyao', 
    'Plaza Aldea', 'Poblacion I', 'Poblacion II', 'Poblacion III', 'Sampaloc', 'San Andres', 
    'Santa Inez', 'Santo Niño', 'Tabing Ilog', 'Tandang Kutyo', 'Wawa'
  ],
  'Teresa': [
    'Bagumbayan', 'Calumpang', 'Dalig', 'Dulumbayan', 'May-Iba', 'Poblacion', 
    'Prinza', 'San Gabriel', 'San Roque'
  ],
  'Morong': [
    'Bombongan', 'Lagundi', 'Maybangcal', 'Poblacion', 'San Guillermo', 'San Jose', 
    'San Juan', 'San Pedro', 'Santo Angel', 'Santo Niño'
  ],
  'Baras': [
    'Concepcion', 'Evangelista', 'Mabini', 'Pinugay', 'Poblacion', 'Rizal', 
    'San Jose', 'San Juan', 'San Salvador', 'Santiago'
  ],
  'Cardona': [
    'Balibago', 'Boor', 'Calahan', 'Dalig', 'Iglesia', 'Lambac', 'Looc', 
    'Malanggam', 'Nagsulo', 'Poblacion I', 'Poblacion II', 'Poblacion III', 
    'Real', 'San Roque', 'Subay', 'Ticulio'
  ],
  'Jalajala': [
    'Bagumbong', 'Lubo', 'Paalaman', 'Palaypalay', 'Poblacion', 'Pulang Lupa', 
    'Punta', 'Quinaweyanan', 'San Isidro', 'Second District', 'Special District', 'Third District'
  ],
  'Pililla': [
    'Bagumbayan', 'Halayhayin', 'Hulo', 'Imatong', 'Malaya', 'Niogan', 'Poblacion', 
    'Quisao', 'Wawa'
  ],
  
  // Pampanga
  'Angeles': [
    'Agapito del Rosario', 'Amsic', 'Balibago', 'Capaya', 'Claro M. Recto', 'Cuayan', 
    'Cutcut', 'Cutud', 'Lourdes Norte', 'Lourdes Sur', 'Malabanias', 'Margot', 
    'Mining', 'Ninoy Aquino', 'Pampang', 'Poblacion', 'Pulung Cacutud', 'Pulung Maragul', 
    'Sapalibutad', 'Sapangbato', 'Santo Cristo', 'Santo Domingo', 'Santo Rosario', 
    'Tabun', 'Virgen delos Remedios'
  ],
  'San Fernando': [
    'Alasas', 'Baliti', 'Bulaon', 'Calulut', 'Dela Paz Norte', 'Dela Paz Sur', 'Dolores', 
    'Juliana', 'Lara', 'Lazatin', 'Lourdes', 'Magliman', 'Maimpis', 'Malino', 'Panipuan', 
    'Poblacion', 'Pulung Bulu', 'Quebiawan', 'Saguin', 'San Agustin', 'San Felipe', 'San Isidro', 
    'San Jose', 'San Juan', 'San Nicolas', 'San Pedro', 'Santa Lucia', 'Santa Teresita', 'Santo Niño', 'Santo Rosario'
  ],
  'Mabalacat': [
    'Atlu-Bola', 'Bical', 'Bundagul', 'Cacutud', 'Calumpang', 'Camachiles', 'Dapdap', 
    'Dolores', 'Duquit', 'Lakandula', 'Mabiga', 'Marcos Village', 'Poblacion', 
    'Poblacion II', 'Poblacion III', 'Poblacion IV', 'Poblacion V', 'Poblacion VI', 
    'Poblacion VII', 'Poblacion VIII', 'Poblacion IX', 'Poblacion X', 'Santa Ines', 'Sapang Biabas', 'Tabun'
  ],
  'Apalit': [
    'Balucuc', 'Calantipe', 'Cansinala', 'Capalangan', 'Colgante', 'Paligui', 
    'Sampaloc', 'San Juan', 'San Vicente', 'Sucad', 'Sulipan', 'Poblacion'
  ],
  'Macabebe': [
    'Batasan', 'Castuli', 'Consuelo', 'Dalayap', 'Dolores', 'Lacmit', 'Lagundi', 
    'Mabuanbuan', 'Malusac', 'Poblacion', 'San Francisco', 'San Isidro', 'San Rafael', 
    'Santa Lutgarda', 'Santa Maria', 'Santa Rita', 'Santo Niño', 'Santo Rosario', 'Tacasan'
  ],
  'Masantol': [
    'Alauli', 'Alis', 'Balibago', 'Bebe Anac', 'Bebe Matua', 'Bulacus', 'Cambasi', 
    'Nigui', 'Paguiruan', 'Palimpe', 'Poblacion', 'San Agustin', 'San Isidro', 
    'San Nicolas I', 'San Nicolas II', 'San Pablo', 'San Pedro I', 'San Pedro II', 
    'Santa Lucia I', 'Santa Lucia II', 'Santa Monica', 'Santo Niño'
  ],
  'Mexico': [
    'Acli', 'Anao', 'Bagong Sikat', 'Barangka', 'Buenavista', 'Camuning', 'Cawayan', 
    'Concepcion', 'Culubasa', 'Divisoria', 'Dolores', 'Eden', 'Gandus', 'Lagundi', 
    'Laput', 'Laug', 'Masamat', 'Masangsang', 'Panasahan', 'Pandacaqui', 'Pangclara', 
    'Panipuan', 'Poblacion', 'Sabanilla', 'San Antonio', 'San Carlos', 'San Jose Malino', 
    'San Juan', 'San Lorenzo', 'San Matias', 'San Nicolas', 'San Pablo', 'San Patricio', 
    'San Rafael', 'San Roque', 'San Vicente', 'Santa Cruz', 'Santa Maria', 'Santiago', 
    'Santo Cristo', 'Santo Domingo', 'Santo Niño', 'Santo Rosario'
  ],
  'Santa Rita': [
    'Becuran', 'Dila Dila', 'San Agustin', 'San Basilio', 'San Isidro', 'San Jose', 
    'San Juan', 'San Matias', 'San Pedro', 'Santa Monica', 'Santo Niño'
  ],
  'Guagua': [
    'Ascomo', 'Bancal', 'Lambac', 'Maquiapo', 'Natividad', 'Pulungmasle', 'San Agustin', 
    'San Isidro', 'San Jose', 'San Juan', 'San Manuel', 'San Matias', 'San Miguel', 
    'San Nicolas I', 'San Nicolas II', 'San Pablo', 'San Pedro', 'San Roque', 'San Vicente', 
    'Santa Cruz', 'Santa Filomena', 'Santa Ines', 'Santo Cristo', 'Santo Niño'
  ],
  'Lubao': [
    'Balantacan', 'Bancal Pugad', 'Bancal Sinubli', 'Baruya', 'Calangain', 'Concepcion', 
    'De La Paz', 'Lourdes', 'Prado Siongco', 'Remedios', 'San Agustin', 'San Antonio', 
    'San Francisco', 'San Isidro', 'San Jose Gumi', 'San Jose Malino', 'San Juan', 
    'San Matias', 'San Miguel', 'San Nicolas I', 'San Nicolas II', 'San Pablo', 
    'San Pedro Palcarangan', 'San Roque Arbol', 'San Vicente', 'Santa Barbara', 
    'Santa Catalina', 'Santa Cruz', 'Santa Maria', 'Santa Monica', 'Santa Rita', 
    'Santa Teresa I', 'Santa Teresa II', 'Santiago', 'Santo Domingo', 'Santo Niño', 
    'Santo Tomas'
  ],
  
  // Cavite
  'Bacoor': [
    'Alima', 'Aniban I', 'Aniban II', 'Aniban III', 'Aniban IV', 'Aniban V', 'Bagong Silang', 
    'Banay-banay', 'Bayanan', 'Campo Santo', 'Daang Bukid', 'Daang Hari', 'Digman', 
    'Dulong Bayan', 'Habay I', 'Habay II', 'Kaingin', 'Kalye Uno', 'Ligas I', 'Ligas II', 
    'Ligas III', 'Maliksi I', 'Maliksi II', 'Maliksi III', 'Mambog I', 'Mambog II', 
    'Mambog III', 'Mambog IV', 'Molino I', 'Molino II', 'Molino III', 'Molino IV', 
    'Molino V', 'Niog I', 'Niog II', 'Niog III', 'Panapaan I', 'Panapaan II', 'Panapaan III', 
    'Panapaan IV', 'Panapaan V', 'Panapaan VI', 'Panapaan VII', 'Panapaan VIII', 'Queens Row Central', 
    'Queens Row East', 'Queens Row West', 'Real I', 'Real II', 'Salinas I', 'Salinas II', 
    'San Nicolas I', 'San Nicolas II', 'San Nicolas III', 'Springville', 'Talaba I', 'Talaba II', 
    'Talaba III', 'Talaba IV', 'Talaba V', 'Talaba VI', 'Talaba VII', 'Zapote I', 'Zapote II', 
    'Zapote III', 'Zapote IV', 'Zapote V'
  ],
  'Imus': [
    'Alapan I-A', 'Alapan I-B', 'Alapan I-C', 'Alapan II-A', 'Alapan II-B', 'Anabu I-A', 
    'Anabu I-B', 'Anabu I-C', 'Anabu I-D', 'Anabu I-E', 'Anabu I-F', 'Anabu I-G', 
    'Anabu I-H', 'Anabu I-I', 'Anabu I-J', 'Anabu II-A', 'Anabu II-B', 'Anabu II-C', 
    'Anabu II-D', 'Anabu II-E', 'Anabu II-F', 'Bayan Luma I', 'Bayan Luma II', 'Bayan Luma III', 
    'Bayan Luma IV', 'Bayan Luma V', 'Bayan Luma VI', 'Bayan Luma VII', 'Bayan Luma VIII', 
    'Bayan Luma IX', 'Bucandala I', 'Bucandala II', 'Bucandala III', 'Bucandala IV', 'Bucandala V', 
    'Maharlika', 'Malagasang I-A', 'Malagasang I-B', 'Malagasang I-C', 'Malagasang I-D', 
    'Malagasang I-E', 'Malagasang I-F', 'Malagasang I-G', 'Malagasang II-A', 'Malagasang II-B', 
    'Malagasang II-C', 'Malagasang II-D', 'Malagasang II-E', 'Malagasang II-F', 'Medicion I-A', 
    'Medicion I-B', 'Medicion I-C', 'Medicion I-D', 'Medicion II-A', 'Medicion II-B', 
    'Medicion II-C', 'Medicion II-D', 'Medicion II-E', 'Medicion II-F', 'Palico I', 'Palico II', 
    'Palico III', 'Palico IV', 'Poblacion I-A', 'Poblacion I-B', 'Poblacion I-C', 'Poblacion II-A', 
    'Poblacion II-B', 'Poblacion III-A', 'Poblacion III-B', 'Poblacion IV-A', 'Poblacion IV-B', 
    'Poblacion IV-C', 'Pulo le Munti', 'Tanzang Luma I', 'Tanzang Luma II', 'Tanzang Luma III', 
    'Tanzang Luma IV', 'Tanzang Luma V', 'Tanzang Luma VI', 'Toclong I-A', 'Toclong I-B', 
    'Toclong I-C', 'Toclong II-A', 'Toclong II-B'
  ],
  'Dasmariñas': [
    'Bagong Bayan', 'Burol I', 'Burol II', 'Burol III', 'Fatima I', 'Fatima II', 'Fatima III', 
    'Langkaan I', 'Langkaan II', 'Lunsad', 'Paliparan I', 'Paliparan II', 'Paliparan III', 
    'Poblacion I', 'Poblacion II', 'Poblacion III', 'Poblacion IV', 'Salawag', 'Salitran I', 
    'Salitran II', 'Salitran III', 'Salitran IV', 'Sampalukan I', 'Sampalukan II', 'Sampalukan III', 
    'Sampalukan IV', 'San Agustin I', 'San Agustin II', 'San Agustin III', 'San Dionisio', 
    'San Jose', 'San Miguel I', 'San Miguel II', 'Zone I', 'Zone II', 'Zone III', 'Zone IV'
  ],
  
  // Laguna
  'Calamba': [
    'Bagong Kalsada', 'Banadero', 'Banlic', 'Barandal', 'Batino', 'Bubuyan', 'Bucal', 
    'Bunggo', 'Burgos', 'Burol', 'Camaligan', 'Canlubang', 'Halang', 'Hornalan', 
    'Kay-Anlog', 'La Mesa', 'Laguna', 'Lawa', 'Lecheria', 'Lingga', 'Looc', 'Mabato', 
    'Majada-Labas', 'Makiling', 'Mapagong', 'Masili', 'Maunong', 'Mayapa', 'Milagrosa', 
    'Paciano Rizal', 'Palingon', 'Palo-Alto', 'Pansol', 'Parian', 'Poblacion', 'Punta', 
    'Quinta', 'Real', 'Saimsim', 'Sampiruhan', 'San Cristobal', 'San Jose', 'San Juan', 
    'Sirang Lupa', 'Sucol', 'Turbina', 'Ulango', 'Uwisan'
  ],
  'Santa Rosa': [
    'Aplaya', 'Balibago', 'Caingin', 'Dila', 'Dita', 'Don Jose', 'Ibaba', 'Kanluran', 
    'Labas', 'Macabling', 'Malusak', 'Market Area', 'Poblacion', 'Pulong Santa Cruz', 
    'Sinalhan', 'Santo Domingo', 'Tagapo'
  ],
  'Biñan': [
    'Bungahan', 'Canlalay', 'Casile', 'dela Paz', 'Ganado', 'Langkiwa', 'Loma', 'Malaban', 
    'Malamig', 'Mamplasan', 'Platero', 'Poblacion', 'San Antonio', 'San Francisco', 'San Jose', 
    'San Vicente', 'Santa Rosa', 'Santo Domingo', 'Santo Niño', 'Santo Tomas', 'Soro-soro', 
    'Tubigan', 'Zapote'
  ],
  'San Pedro': [
    'Bagong Silang Poblacion', 'Calendola', 'Chrysanthemum', 'Cuyab', 'Estrella Poblacion', 
    'G.S.I.S.', 'Landayan', 'Langgam', 'Laram', 'Magsaysay', 'Maharlika Poblacion', 
    'Narra', 'Nueva', 'Pacita I', 'Pacita II', 'Poblacion', 'Riverside', 'Rosario Poblacion', 
    'Sampaguita Village', 'San Antonio Poblacion', 'San Roque Poblacion', 'San Vicente Poblacion', 
    'Santo Niño Poblacion', 'United Bayanihan', 'United Better Living'
  ],
  'Los Baños': [
    'Anos', 'Bagong Silang', 'Bambang', 'Batong Malake', 'Bay', 'Baybayin', 'Bayog', 
    'Lalakay', 'Malinta', 'Mayondon', 'Poblacion', 'Putho-Tuntungin', 'San Antonio', 'Tadlac', 'Timugan'
  ],
  'Cabuyao': [
    'Banay-Banay', 'Banlic', 'Barangay Uno', 'Bigaa', 'Butong', 'Casile', 'Diezmo', 
    'Gulod', 'Mamatid', 'Marinig', 'Niugan', 'Pittland', 'Poblacion Dos', 'Poblacion Tres', 
    'Poblacion Uno', 'Pulo', 'Sala', 'San Isidro'
  ],
  'San Pablo': [
    'I-A (Poblacion)', 'I-B (Poblacion)', 'I-C (Poblacion)', 'II-A (Poblacion)', 'II-B (Poblacion)', 
    'II-C (Poblacion)', 'II-D (Poblacion)', 'II-E (Poblacion)', 'II-F (Poblacion)', 'III-A (Poblacion)', 
    'III-B (Poblacion)', 'III-C (Poblacion)', 'III-D (Poblacion)', 'III-E (Poblacion)', 'III-F (Poblacion)', 
    'IV-A (Poblacion)', 'IV-B (Poblacion)', 'IV-C (Poblacion)', 'V-A (Poblacion)', 'V-B (Poblacion)', 
    'V-C (Poblacion)', 'V-D (Poblacion)', 'VI-A (Poblacion)', 'VI-B (Poblacion)', 'VI-C (Poblacion)', 
    'VI-D (Poblacion)', 'VI-E (Poblacion)', 'VII-A (Poblacion)', 'VII-B (Poblacion)', 'VII-C (Poblacion)', 
    'VII-D (Poblacion)', 'Atisan', 'Bagong Bayan', 'Bahay', 'Banakdo', 'Baras', 'Bautista', 
    'Concepcion', 'Del Remedio', 'Dolores', 'San Antonio I (Balanga)', 'San Antonio II (Sapa)', 
    'San Bartolome', 'San Buenaventura', 'San Crispin', 'San Cristobal', 'San Diego', 'San Francisco (Calihan)', 
    'San Gabriel', 'San Gregorio', 'San Ignacio', 'San Isidro (Balagbag)', 'San Joaquin', 'San Jose (Malamig)', 
    'San Juan', 'San Lorenzo (Saluban)', 'San Lucas I', 'San Lucas II', 'San Marcos (Tikew)', 'San Mateo', 
    'San Miguel', 'San Nicolas', 'San Pedro', 'San Rafael (Magampon)', 'San Roque (Butucan)', 'San Vicente', 
    'Santa Ana', 'Santa Catalina', 'Santa Cruz (Putol)', 'Santa Elena', 'Santa Filomena', 'Santa Isabel', 
    'Santa Maria', 'Santa Maria Magdalena', 'Santa Monica', 'Santa Veronica', 'Santiago I (Bulaho)', 
    'Santiago II', 'Santo Angel (Ilog)', 'Santo Cristo', 'Santo Niño (Arsum)', 'Santisimo Rosario'
  ],
  'Sta. Cruz': [
    'Alipit', 'Bagumbayan', 'Buboy', 'Bubukal', 'Calios', 'Cambuja', 'Duhat', 'Gatid', 
    'Jasaan', 'Labuin', 'Malinao', 'Maravilla', 'Olivarez', 'Pagsawitan', 'Paniki', 
    'Poblacion I', 'Poblacion II', 'Poblacion III', 'Poblacion IV', 'Poblacion V', 
    'San Jose', 'San Juan', 'San Pablo Norte', 'San Pablo Sur', 'Santisima Cruz'
  ],
  'Pagsanjan': [
    'Anibong', 'Babatnin', 'Cabanbanan', 'Calusiche', 'Dingin', 'Lambac', 'Magdapio', 
    'Maulawin', 'Mendiola', 'Poblacion I', 'Poblacion II', 'Sabang', 'Sampaloc', 
    'San Isidro', 'Talahib', 'Two Rivers'
  ],
  'Liliw': [
    'Bagong Anyo (Poblacion)', 'Bayate', 'Bongkol', 'Bubukal', 'Cabuyew', 'Calumpang', 
    'Culoy', 'Dagatan', 'Daniw', 'Dita', 'Ibabang Palina', 'Ibabang San Roque', 
    'Ibabang Sungi', 'Ibabang Taykin', 'Ilayang Palina', 'Ilayang San Roque', 
    'Ilayang Sungi', 'Ilayang Taykin', 'Kanlurang Bukal', 'Laguan', 'Luquin', 
    'Malabo-Kalantukan', 'Masalac', 'Maslun (Poblacion)', 'Mojon', 'Novaliches', 
    'Oples', 'Pag-asa (Poblacion)', 'Palayan', 'Rizal (Poblacion)', 'San Isidro', 
    'Silangang Bukal', 'Tuy-Baanan'
  ],
  'General Trias': [
    'Alingaro', 'Arnaldo Poblacion', 'Bacao I', 'Bacao II', 'Bagumbayan Poblacion', 'Biclatan', 
    'Buenavista I', 'Buenavista II', 'Buenavista III', 'Corregidor Poblacion', 'Dulong Bayan Poblacion', 
    'Gov. Ferrer Poblacion', 'Javalera', 'Manggahan', 'Navarro', 'Ninety Six', 'Panungyanan', 
    'Pasong Camachile I', 'Pasong Camachile II', 'Pasong Kawayan I', 'Pasong Kawayan II', 
    'Pinagtipunan', 'Poblacion', 'Prinza Poblacion', 'San Francisco', 'San Gabriel Poblacion', 
    'San Juan I', 'San Juan II', 'Santiago', 'Tabhawainan', 'Tejero', 'Vibora Poblacion'
  ],
  'Cavite City': [
    'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 
    'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 
    'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17', 'Barangay 18', 
    'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 
    'Barangay 25', 'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30', 
    'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35', 'Barangay 36', 
    'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40', 'Barangay 41', 'Barangay 42', 
    'Barangay 43', 'Barangay 44', 'Barangay 45', 'Barangay 46', 'Barangay 47', 'Barangay 48', 
    'Barangay 49', 'Barangay 50', 'Barangay 51', 'Barangay 52', 'Barangay 53', 'Barangay 54', 
    'Barangay 55', 'Barangay 56', 'Barangay 57', 'Barangay 58', 'Barangay 59', 'Barangay 60', 
    'Barangay 61', 'Barangay 62', 'Barangay 63', 'Barangay 64', 'Barangay 65', 'Barangay 66', 
    'Barangay 67', 'Barangay 68', 'Barangay 69', 'Barangay 70', 'Barangay 71', 'Barangay 72', 
    'Barangay 73', 'Barangay 74', 'Barangay 75', 'Barangay 76', 'Barangay 77', 'Barangay 78', 
    'Barangay 79', 'Barangay 80', 'Barangay 81', 'Barangay 82', 'Barangay 83', 'Barangay 84'
  ],
  'Rosario': [
    'Kanluran', 'Ligtong I', 'Ligtong II', 'Ligtong III', 'Ligtong IV', 'Poblacion', 
    'Salinas I', 'Salinas II', 'Salinas III', 'Salinas IV', 'Silangan I', 'Silangan II', 
    'Sapa I', 'Sapa II', 'Sapa III', 'Tejeros Convention', 'Wawa I', 'Wawa II'
  ],
  'Silang': [
    'Adlas', 'Anahaw I', 'Anahaw II', 'Balite I', 'Balite II', 'Biga I', 'Biga II', 
    'Bol-os', 'Bucal', 'Bulihan', 'Carmen', 'Hukay', 'Iba', 'Lalaan I', 'Lalaan II', 
    'Litlit', 'Maguyam', 'Malabag', 'Mataas na Burol', 'Narra I', 'Narra II', 'Paligawan', 
    'Poblacion I', 'Poblacion II', 'Poblacion III', 'Pooc I', 'Pooc II', 'Pulong Bunga', 
    'Pulong Saging', 'Sabang', 'Santolan', 'Tartaria', 'Tibig', 'Tubigan'
  ],
  'Carmona': [
    'Bancal', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 
    'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 
    'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17', 
    'Barangay 18', 'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23', 
    'Barangay 24', 'Barangay 25', 'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 
    'Barangay 30', 'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35', 
    'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40', 'Barangay 41', 
    'Barangay 42', 'Barangay 43', 'Barangay 44', 'Barangay 45', 'Barangay 46', 'Barangay 47', 
    'Barangay 48', 'Cabilang Baybay', 'Lantic', 'Maduya', 'Mabuhay', 'Milagrosa'
  ],
  'General Mariano Alvarez': [
    'Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)', 'Barangay IV (Poblacion)', 
    'Barangay V (Poblacion)', 'Barangay VI (Poblacion)', 'Barangay VII (Poblacion)', 'Barangay VIII (Poblacion)', 
    'Barangay IX (Poblacion)', 'Barangay X (Poblacion)', 'Barangay XI (Poblacion)', 'Barangay XII (Poblacion)', 
    'Barangay XIII (Poblacion)', 'Barangay XIV (Poblacion)', 'Barangay XV (Poblacion)', 'Barangay XVI (Poblacion)', 
    'Barangay XVII (Poblacion)', 'Barangay XVIII (Poblacion)', 'Barangay XIX (Poblacion)', 'Barangay XX (Poblacion)', 
    'Barangay XXI (Poblacion)', 'Barangay XXII (Poblacion)', 'Barangay XXIII (Poblacion)', 'Barangay XXIV (Poblacion)', 
    'Barangay XXV (Poblacion)', 'Barangay XXVI (Poblacion)', 'Barangay XXVII (Poblacion)', 'Barangay XXVIII (Poblacion)', 
    'Barangay XXIX (Poblacion)', 'Barangay XXX (Poblacion)', 'Barangay XXXI (Poblacion)', 'Barangay XXXII (Poblacion)', 
    'Barangay XXXIII (Poblacion)', 'Barangay XXXIV (Poblacion)', 'Barangay XXXV (Poblacion)', 'Barangay XXXVI (Poblacion)'
  ],
  'Trece Martires': [
    'Aguado', 'Bagong Silang (Poblacion)', 'Cabezas', 'Cabuco', 'Conchu (Poblacion)', 'De La Salle', 
    'Gregorio (Poblacion)', 'Hugo Perez (Poblacion)', 'Inocencio (Poblacion)', 'Lallana', 'Lapidario (Poblacion)', 
    'Luciano (Poblacion)', 'Osorio (Poblacion)', 'Perez (Poblacion)', 'Quintero (Poblacion)', 'Riego (Poblacion)', 
    'San Agustin (Poblacion)', 'Valentin (Poblacion)'
  ]
};

// City zip codes mapping (4-digit Philippine zip codes)
const CITY_ZIP_CODES: Record<string, string> = {
  // Metro Manila
  'Manila': '1000', 'Quezon City': '1100', 'Makati': '1200', 'Pasig': '1600',
  'Taguig': '1630', 'Mandaluyong': '1550', 'Pasay': '1300', 'Caloocan': '1400',
  'Marikina': '1800', 'San Juan': '1500', 'Muntinlupa': '1770', 'Parañaque': '1700',
  'Las Piñas': '1740', 'Valenzuela': '1440', 'Malabon': '1470', 'Navotas': '1485',
  'Pateros': '1620',
  // Rizal
  'Antipolo': '1870', 'Cainta': '1900', 'Taytay': '1920', 'Angono': '1930',
  'Binangonan': '1940', 'Rodriguez': '1860', 'San Mateo': '1850', 'Tanay': '1980',
  'Teresa': '1880', 'Morong': '1960', 'Baras': '1970', 'Cardona': '1950',
  'Jalajala': '1990', 'Pililla': '1910',
  // Cavite
  'Bacoor': '4102', 'Imus': '4103', 'Dasmariñas': '4114', 'Cavite City': '4100',
  'General Trias': '4107', 'Rosario': '4106', 'Silang': '4118', 'Carmona': '4116',
  'General Mariano Alvarez': '4117', 'Trece Martires': '4109',
  // Laguna
  'Calamba': '4027', 'Santa Rosa': '4026', 'Biñan': '4024', 'San Pedro': '4023',
  'Los Baños': '4030', 'Cabuyao': '4025', 'San Pablo': '4000', 'Sta. Cruz': '4009',
  'Pagsanjan': '4004', 'Liliw': '4004',
  // Bulacan
  'Malolos': '3000', 'Meycauayan': '3020', 'San Jose del Monte': '3023', 'Marilao': '3019',
  'Bocaue': '3018', 'Balagtas': '3016', 'Guiguinto': '3015', 'Pandi': '3014',
  'Santa Maria': '3022', 'Obando': '3021',
  // Pampanga
  'San Fernando': '2000', 'Angeles': '2009', 'Mabalacat': '2010', 'Apalit': '2016',
  'Macabebe': '2018', 'Masantol': '2017', 'Mexico': '2021', 'Santa Rita': '2001',
  'Guagua': '2003', 'Lubao': '2005'
};

// Phone number validation function
const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  if (cleanPhone.length !== 11) {
    return { isValid: false, message: 'Phone number must be exactly 11 digits' };
  }
  
  if (!cleanPhone.startsWith('09')) {
    return { isValid: false, message: 'Phone number must start with 09' };
  }
  
  return { isValid: true, message: '' };
};

interface CheckoutItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  productImage?: string;
  unit: string;
  sellerId: string;
  sellerName: string;
}

interface CheckoutData {
  items: CheckoutItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

interface SavedAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  barangay?: string;
  city: string;
  province: string;
  zipCode?: string;
  isDefault: boolean;
  type: 'delivery' | 'pickup' | 'both';
}

interface DeliveryOption {
  type: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
  fee: number;
  overweight?: boolean;
}

// Vehicle configuration for weight limits
const VEHICLE_CONFIG: { [key: string]: { max: number } } = {
  MOTORCYCLE: { max: 20 },
  SEDAN: { max: 50 },
  MPV: { max: 100 },
  VAN: { max: 200 },
  TRUCK: { max: 500 }
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthUserData();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('MOTORCYCLE');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [currentDeliveryFee, setCurrentDeliveryFee] = useState<number>(0);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // Helper function to format phone number
  const formatPhoneNumber = (phone: string): string => {
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Auto-add "09" if user starts with digits other than 0
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('0')) {
      cleanPhone = '09' + cleanPhone;
    }
    
    // Limit to exactly 11 digits
    cleanPhone = cleanPhone.slice(0, 11);
    
    // Format as 09XX XXX XXXX
    if (cleanPhone.length >= 4) {
      if (cleanPhone.length <= 7) {
        return cleanPhone.replace(/(\d{4})(\d{0,3})/, '$1 $2');
      } else {
        return cleanPhone.replace(/(\d{4})(\d{3})(\d{0,4})/, '$1 $2 $3');
      }
    }
    
    return cleanPhone;
  };

  // Handle city change - auto-fill ZIP code and reset barangay and street
  const handleCityChange = (newCity: string) => {
    const zipCode = CITY_ZIP_CODES[newCity] || '';
    setShippingAddress(prev => ({
      ...prev,
      city: newCity,
      zipCode: zipCode,
      barangay: '', // Reset barangay when city changes
      street: '' // Reset street address when city changes
    }));
  };

  // Handle province change - reset city, barangay, ZIP code, and street
  const handleProvinceChange = (newProvince: string) => {
    setShippingAddress(prev => ({
      ...prev,
      province: newProvince,
      city: '',
      barangay: '', // Reset barangay when province changes
      zipCode: '',
      street: '' // Reset street address when province changes
    }));
  };

  // Handle barangay change - reset street
  const handleBarangayChange = (newBarangay: string) => {
    setShippingAddress(prev => ({
      ...prev,
      barangay: newBarangay,
      street: '' // Reset street when barangay changes
    }));
  };

  // Handle phone number change with formatting
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setShippingAddress(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  // Handle ZIP code change - only allow 4 digits
  const handleZipCodeChange = (value: string) => {
    const cleanZip = value.replace(/\D/g, '').slice(0, 4);
    setShippingAddress(prev => ({
      ...prev,
      zipCode: cleanZip
    }));
  };
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    description: string;
    type: string;
    discount: number;
    freeDelivery: boolean;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState<Array<{
    code: string;
    description: string;
    type: string;
  }>>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const data = sessionStorage.getItem('checkoutItems');
    if (!data) {
      router.push('/cart');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setCheckoutData(parsedData);
    } catch {
      router.push('/cart');
    } finally {
      setLoading(false);
    }

    fetchSavedAddresses();
    fetchAvailableVouchers();
  }, [isAuthenticated, router]);

  const fetchAvailableVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers/available', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableVouchers(data.vouchers || []);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  // Calculate delivery options when address province changes
  useEffect(() => {
    if (shippingAddress.province && checkoutData) {
      // Calculate total weight from items - FIXED FOR ACCURATE WEIGHT
      const totalWeight = checkoutData.items.reduce((sum, item) => {
        const unit = item.unit.toLowerCase().trim();
        
        // Use QUANTITY and UNIT - not product name!
        // If unit contains 'kg' or 'kilo', the quantity IS the weight in kg
        if (unit.includes('kg') || unit.includes('kilo')) {
          return sum + item.quantity; // 1 kg = 1 kg exactly
        }
        // If unit is 'g' or 'gram', convert to kg
        else if (unit.includes('g') && !unit.includes('kg')) {
          return sum + (item.quantity / 1000); // 1000g = 1kg
        }
        // For bundles/bunches - check product name for weight
        else if (unit.includes('bundle') || unit.includes('bunch')) {
          const productName = item.productName.toLowerCase();
          const weightMatch = productName.match(/(\d+(?:\.\d+)?)\s*kg/i);
          if (weightMatch) {
            const weightPerBundle = parseFloat(weightMatch[1]);
            return sum + (item.quantity * weightPerBundle);
          }
          // Default bundle weight if not specified
          return sum + (item.quantity * 1.5);
        }
        // For sacks, estimate 25 kg each
        else if (unit.includes('sack') || unit.includes('bag')) {
          return sum + (item.quantity * 25);
        }
        // For pieces, estimate 0.3 kg each (lighter default)
        else {
          return sum + (item.quantity * 0.3);
        }
      }, 0);

      console.log('Calculated weight:', totalWeight, 'kg from items:', checkoutData.items);

      const options = calculateDeliveryFees(
        shippingAddress.province,
        shippingAddress.city,
        totalWeight,
        checkoutData.subtotal
      );
      setDeliveryOptions(options);
      
      // AUTO-SELECT RECOMMENDED VEHICLE based on weight
      const recommendedOption = options.find(opt => opt.description.includes('⭐ Recommended'));
      const vehicleToSelect = recommendedOption?.type || 'MOTORCYCLE';
      
      // Only update if different from current selection
      if (vehicleToSelect !== selectedVehicle) {
        setSelectedVehicle(vehicleToSelect);
      }
      
      // Update selected vehicle fee
      const selectedOption = options.find(opt => opt.type === vehicleToSelect);
      if (selectedOption) {
        setCurrentDeliveryFee(selectedOption.fee);
        // Update checkout data with new shipping fee
        setCheckoutData(prev => prev ? {
          ...prev,
          shippingFee: selectedOption.fee,
          total: prev.subtotal + selectedOption.fee
        } : null);
      }
    }
  }, [shippingAddress.province, shippingAddress.city, checkoutData?.subtotal]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const deliveryAddresses = data.addresses.filter((addr: SavedAddress) => 
          addr.type === 'delivery' || addr.type === 'both'
        );
        setSavedAddresses(deliveryAddresses);

        // Auto-select default address
        const defaultAddr = deliveryAddresses.find((addr: SavedAddress) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          setShippingAddress({
            fullName: defaultAddr.fullName,
            phone: defaultAddr.phone,
            street: defaultAddr.street,
            city: defaultAddr.city,
            province: defaultAddr.province,
            zipCode: defaultAddr.zipCode || ''
          });
        }
      }
    } catch (error) {
      // Only log if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching addresses:', error);
      }
    }
  };

  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedAddressId(address._id);
    setUseNewAddress(false);
    setShippingAddress({
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      province: address.province,
      zipCode: address.zipCode || ''
    });
  };

  const handleVehicleSelect = (vehicleType: string) => {
    // Prevent selection of overweight vehicles
    const selectedOption = deliveryOptions.find(opt => opt.type === vehicleType);
    if (selectedOption?.description.includes('⚠️ Overweight')) {
      alert('This vehicle cannot carry your order weight. Please select a larger vehicle.');
      return;
    }
    
    setSelectedVehicle(vehicleType);
    if (selectedOption && checkoutData) {
      setCurrentDeliveryFee(selectedOption.fee);
      setCheckoutData(prev => prev ? {
        ...prev,
        shippingFee: selectedOption.fee,
        total: prev.subtotal + selectedOption.fee
      } : null);
    }
  };

  const validateForm = () => {
    // Validate full name
    if (!shippingAddress.fullName?.trim()) {
      alert('Please enter your full name');
      return false;
    }
    
    // Validate phone number with proper format
    if (!shippingAddress.phone?.trim()) {
      alert('Please enter your phone number');
      return false;
    }
    
    const phoneValidation = validatePhoneNumber(shippingAddress.phone);
    if (!phoneValidation.isValid) {
      alert(phoneValidation.message);
      return false;
    }
    
    // Validate street address
    if (!shippingAddress.street?.trim()) {
      alert('Please enter your street address');
      return false;
    }
    
    // Validate city
    if (!shippingAddress.city?.trim()) {
      alert('Please enter your city');
      return false;
    }
    
    // Validate barangay
    if (!shippingAddress.barangay?.trim()) {
      alert('Please select your barangay');
      return false;
    }
    
    // Validate province
    if (!shippingAddress.province?.trim()) {
      alert('Please enter your province');
      return false;
    }

    // Validate ZIP code
    if (!shippingAddress.zipCode?.trim()) {
      alert('Please enter your ZIP code');
      return false;
    }
    
    if (!/^\d{4}$/.test(shippingAddress.zipCode)) {
      alert('ZIP code must be exactly 4 digits');
      return false;
    }
    
    // Validate ZIP code matches city if we have it in our database
    if (CITY_ZIP_CODES[shippingAddress.city] && 
        CITY_ZIP_CODES[shippingAddress.city] !== shippingAddress.zipCode) {
      alert(`ZIP code for ${shippingAddress.city} should be ${CITY_ZIP_CODES[shippingAddress.city]}`);
      return false;
    }

    // Check if delivery is available to the province
    if (!isDeliveryAvailable(shippingAddress.province)) {
      alert('Sorry, delivery is not available to your province at this time. Please contact support for assistance.');
      return false;
    }

    return true;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    if (!checkoutData) {
      setVoucherError('Checkout data not loaded');
      return;
    }

    setVoucherLoading(true);
    setVoucherError('');

    try {
      console.log('Applying voucher:', voucherCode, 'Subtotal:', checkoutData.subtotal);
      
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          code: voucherCode.toUpperCase().trim(),
          subtotal: checkoutData.subtotal
        })
      });

      const data = await response.json();
      console.log('Voucher validation response:', data);

      if (!response.ok) {
        console.error('Voucher validation failed:', data);
        setVoucherError(data.error || 'Invalid voucher code');
        setAppliedVoucher(null);
        return;
      }

      console.log('Voucher applied successfully:', data.voucher);
      setAppliedVoucher(data.voucher);
      setVoucherError('');
      
      // If it's a free delivery voucher, set delivery fee to 0
      if (data.voucher.freeDelivery) {
        console.log('Setting delivery fee to 0 for free delivery voucher');
        setCurrentDeliveryFee(0);
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      setVoucherError('Failed to apply voucher. Please try again.');
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    
    // Recalculate delivery fee from selected vehicle
    if (shippingAddress.province) {
      const fee = getDeliveryFee(shippingAddress.province, selectedVehicle);
      setCurrentDeliveryFee(fee);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || !checkoutData) return;

    setPlacing(true);

    try {
      // If using a new address, save it to address management first
      if (useNewAddress && shippingAddress.fullName) {
        try {
          const addressData = {
            label: 'Delivery Address',
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            street: shippingAddress.street,
            barangay: shippingAddress.barangay || '',
            city: shippingAddress.city,
            province: shippingAddress.province,
            zipCode: shippingAddress.zipCode,
            isDefault: false,
            type: 'delivery'
          };

          const saveAddressResponse = await fetch('/api/user/addresses', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
          });

          if (saveAddressResponse.ok) {
            console.log('✅ Address saved to address management');
          }
        } catch (error) {
          console.log('⚠️ Could not save address to management, but continuing with order:', error);
          // Don't block order placement if address save fails
        }
      }

      const orderData = {
        items: checkoutData.items,
        shippingAddress,
        paymentMethod,
        shippingFee: currentDeliveryFee,
        lalamoveQuotationId: `MOCK-QUOTE-${Date.now()}`, // Mock quotation for demo
        deliveryDetails: {
          vehicleType: selectedVehicle,
          deliveryFee: currentDeliveryFee,
          estimatedTime: deliveryOptions.find(opt => opt.type === selectedVehicle)?.estimatedTime
        },
        pricing: {
          subtotal: checkoutData.subtotal,
          shippingFee: currentDeliveryFee,
          total: checkoutData.subtotal + currentDeliveryFee
        }
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear checkout data from session storage
        sessionStorage.removeItem('checkoutItems');
        
        // Redirect to order confirmation
        router.push(`/orders/${result.orderId}?success=true`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please check your connection and try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No items to checkout</h1>
          <Link href="/cart" className="text-green-600 hover:underline">
            Go back to cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/cart" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4 font-medium"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {checkoutData.items.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {item.productImage && (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Seller: {item.sellerName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × ₱{item.pricePerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₱{item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              
              {/* Saved Addresses */}
              {savedAddresses.length > 0 && !useNewAddress && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Select saved address:</h3>
                  <div className="space-y-3">
                    {savedAddresses.map((address) => (
                      <div
                        key={address._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address._id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAddressSelect(address)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{address.fullName}</p>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-600">
                                {address.street}, {address.barangay && `${address.barangay}, `}{address.city}, {address.province}
                              {address.zipCode && ` ${address.zipCode}`}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {address.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className="mt-3 text-green-600 hover:underline text-sm"
                  >
                    Use a different address
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => setUseNewAddress(false)}
                      className="text-green-600 hover:underline text-sm mb-4"
                    >
                      ← Back to saved addresses
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number * (09XX XXX XXXX)"
                        value={shippingAddress.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        maxLength={13}
                      />
                      <p className="text-xs text-gray-500 mt-1">Must start with 09 and be 11 digits</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province *
                      </label>
                      <select
                        value={shippingAddress.province}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Province</option>
                        {Object.keys(PROVINCE_CITIES).map((province) => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <select
                        value={shippingAddress.city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={!shippingAddress.province}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">Select City</option>
                        {shippingAddress.province && PROVINCE_CITIES[shippingAddress.province]?.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        placeholder={shippingAddress.city && CITY_ZIP_CODES[shippingAddress.city] ? 
                          `Auto: ${CITY_ZIP_CODES[shippingAddress.city]}` : "4 digits"}
                        value={shippingAddress.zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        maxLength={4}
                      />
                      {shippingAddress.city && CITY_ZIP_CODES[shippingAddress.city] && (
                        <p className="text-xs text-green-600 mt-1">
                          Expected: {CITY_ZIP_CODES[shippingAddress.city]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barangay *
                    </label>
                    <select
                      value={shippingAddress.barangay}
                      onChange={(e) => handleBarangayChange(e.target.value)}
                      disabled={!shippingAddress.city}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Select Barangay</option>
                      {shippingAddress.city && CITY_BARANGAYS[shippingAddress.city]?.map((barangay) => (
                        <option key={barangay} value={barangay}>{barangay}</option>
                      ))}
                      {shippingAddress.city && !CITY_BARANGAYS[shippingAddress.city] && (
                        <option value="Not Listed">Barangay (Type manually in street address)</option>
                      )}
                    </select>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Street Address, Building, Unit Number *"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
            </div>

            {/* Delivery Options */}
            {deliveryOptions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Total Weight: <span className="font-semibold">{checkoutData.items.reduce((sum, item) => {
                    const unit = item.unit.toLowerCase().trim();
                    if (unit.includes('kg') || unit.includes('kilo')) return sum + item.quantity;
                    else if (unit.includes('bundle') || unit.includes('bunch')) {
                      const weightMatch = item.productName.toLowerCase().match(/(\d+(?:\.\d+)?)\s*kg/i);
                      return sum + (weightMatch ? item.quantity * parseFloat(weightMatch[1]) : item.quantity * 1.5);
                    }
                    return sum + (item.quantity * 0.3);
                  }, 0).toFixed(1)} kg</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {deliveryOptions.map((option) => {
                    const isOverweight = option.overweight || option.description.includes('⚠️ Overweight');
                    const isRecommended = option.description.includes('⭐ Recommended');
                    const isDisabled = isOverweight;
                    
                    return (
                      <div
                        key={option.type}
                        className={`relative p-4 border-2 rounded-lg transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300'
                            : selectedVehicle === option.type
                            ? 'border-green-500 bg-green-50 cursor-pointer shadow-lg ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-400 hover:shadow-md cursor-pointer bg-white'
                        }`}
                        onClick={() => !isDisabled && handleVehicleSelect(option.type)}
                      >
                        {/* Disabled Overlay */}
                        {isDisabled && (
                          <div className="absolute inset-0 bg-gray-200 bg-opacity-60 rounded-lg flex items-center justify-center z-10">
                            <div className="text-center">
                              <span className="text-4xl">🚫</span>
                              <p className="text-xs font-bold text-red-700 mt-1">TOO HEAVY</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className={`text-3xl mb-2 ${isDisabled ? 'grayscale opacity-50' : ''}`}>
                            {option.icon}
                          </div>
                          <h3 className={`font-semibold mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                            {option.name}
                          </h3>
                          
                          {/* Recommended or Overweight Badge */}
                          {isRecommended && !isDisabled && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                ⭐ Best Choice
                              </span>
                            </div>
                          )}
                          {isOverweight && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                ⚠️ Max {VEHICLE_CONFIG[option.type]?.max || 20}kg
                              </span>
                            </div>
                          )}
                          
                          <p className={`text-xs mb-2 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                            {option.estimatedTime}
                          </p>
                          <p className={`font-bold text-xl ${
                            isDisabled 
                              ? 'text-gray-400' 
                              : selectedVehicle === option.type
                              ? 'text-green-700'
                              : 'text-green-600'
                          }`}>
                            ₱{option.fee}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay when your order is delivered</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Voucher Input */}
              <div className="mb-4 pb-4 border-b">
                <label className="block text-sm font-medium mb-2">Voucher Code</label>
                {!appliedVoucher ? (
                  <>
                    {/* Available Vouchers Dropdown */}
                    {availableVouchers.length > 0 && (
                      <div className="mb-2">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setVoucherCode(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          disabled={voucherLoading}
                        >
                          <option value="">Select a voucher</option>
                          {availableVouchers.map((voucher) => (
                            <option key={voucher.code} value={voucher.code}>
                              {voucher.code} - {voucher.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Manual Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Or enter voucher code"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={voucherLoading}
                      />
                      <button
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherCode.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {voucherLoading ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-green-700">{appliedVoucher.code}</div>
                      <div className="text-xs text-green-600">{appliedVoucher.description}</div>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {voucherError && (
                  <p className="text-sm text-red-600 mt-1">{voucherError}</p>
                )}
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₱{checkoutData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="ml-4">VATable Amount</span>
                  <span>₱{(checkoutData.subtotal / 1.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="ml-4">VAT (12%)</span>
                  <span>₱{(checkoutData.subtotal - (checkoutData.subtotal / 1.12)).toFixed(2)}</span>
                </div>
                {appliedVoucher && appliedVoucher.type !== 'free_delivery' && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Discount</span>
                    <span>-₱{appliedVoucher.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={appliedVoucher?.freeDelivery ? 'line-through text-gray-400' : ''}>
                    ₱{currentDeliveryFee.toFixed(2)}
                  </span>
                </div>
                {appliedVoucher?.freeDelivery && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Free Delivery Applied!</span>
                    <span>-₱{currentDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₱{(
                      checkoutData.subtotal 
                      - (appliedVoucher && appliedVoucher.type !== 'free_delivery' ? appliedVoucher.discount : 0)
                      + (appliedVoucher?.freeDelivery ? 0 : currentDeliveryFee)
                    ).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !shippingAddress.province || deliveryOptions.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {placing ? (
                  <span className="flex items-center justify-center">
                    <LoadingDots />
                    <span className="ml-2">Placing Order...</span>
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>

              {!shippingAddress.province && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Please enter your delivery address to see shipping options
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

